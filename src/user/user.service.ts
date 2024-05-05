import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import { LocalAuthUserDto } from 'src/auth/dto/local-auth-user.dto';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';
import { ActiveStatusEnum } from 'src/common/enums/active.enum';
import { AuthTypeEnum } from 'src/common/enums/auth-type.enum';
import { VerifcationStatusEnum } from 'src/common/enums/verification.enum';
import { CryptoUtil } from 'src/common/utils/crypto.util';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserReponseDto } from './dto/user-response.dto';
import { UserEntity } from './entities/user.entity/user.entity';
import { UserRepository } from './repositories/user.repository';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { UserSearchDto } from './dto/user-search.dto';
import { UserFilterUtil } from 'src/common/utils/user-filter.util';
import { S3Service } from 'src/s3/s3.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly crypto: CryptoUtil,
    private readonly userFilterUtil: UserFilterUtil,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly mailService: MailService,
  ) {}

  async create(registerUserDto: RegisterUserDto): Promise<UserEntity> {
    const isEmailDuplicate = await this.userRepository.findOne({
      where: { email: registerUserDto.email },
    });

    if (isEmailDuplicate) {
      throw new BadRequestException('Email already exist!');
    }

    registerUserDto.password = await this.crypto.hashPassword(
      registerUserDto.password,
    );

    const verificationToken = this.generateVerificationToken();

    const refreshToken = (Math.random() * 0xfffff * 1000000).toString(16);
    const userEntity = {
      ...registerUserDto,
      is_verified: VerifcationStatusEnum.NOT_VERIFIED,
      verification_token: verificationToken,
      status: ActiveStatusEnum.INACTIVE,
      auth_type: AuthTypeEnum.Local,
      refresh_token: refreshToken,
      created_at: new Date(),
    };

    const verificationUrl = `${process.env.CLIENT_URL}/auth/verify-email/${verificationToken}`;

    const verificationEmailSubject = 'Verify Your Email Address';
    const verificationEmailBody = `Hello ${registerUserDto.name},\n\nPlease verify your email address by clicking on the following link:\n\n${verificationUrl}`;
    await this.mailService.sendmail(
      registerUserDto.email,
      verificationEmailSubject,
      verificationEmailBody,
    );

    const user = await this.userRepository.save(userEntity);
    delete user.password;
    return user;
  }

  async validateUserEmailPass(
    localUser: LocalAuthUserDto,
  ): Promise<UserReponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: localUser.email },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (
      !(await this.crypto.comparePassword(localUser.password, user.password))
    ) {
      throw new UnauthorizedException('Login credentials not accepted');
    }

    if (!user.is_verified) {
      throw new UnauthorizedException('Email not verified');
    }
    delete user.password;

    //generate token
    const access_token = this.generateJwtToken(user);

    const refreshToken = (Math.random() * 0xfffff * 1000000).toString(16);
    user.refresh_token = refreshToken;
    await user.save();
    return { ...user, access_token };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOneBy({
        verification_token: token,
      });

      if (!user) {
        throw new NotFoundException('Verification token not found');
      }

      user.verification_token = null;
      user.is_verified = VerifcationStatusEnum.VERIFIED;
      user.status = ActiveStatusEnum.ACTIVE;

      user.verified_at = new Date();
      await this.userRepository.save(user);
      return { message: 'Email verified successfully' };
    } catch (error) {
      throw new BadRequestException('Error verifying email token');
    }
  }

  private generateJwtToken(user: UserEntity): string {
    const payload = {
      id: user.id,
      email: user.email,
      is_verified: user.is_verified,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '30m',
    });

    return token;
  }

  async generateAccessToken(token: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { refresh_token: token },
      });

      if (!user) {
        throw new NotFoundException('Refresh token is not valid');
      }

      const access_token = this.generateJwtToken(user);

      user.refresh_token = (Math.random() * 0xfffff * 1000000).toString(16);

      await user.save();

      return { ...user, access_token };
    } catch (error) {
      throw new BadRequestException();
    }
  }

  generateVerificationToken(): string {
    const timestamp = new Date().getTime().toString(16).slice(-8);
    const randomToken = (Math.random() * 0xfffff * 1000000)
      .toString(16)
      .slice(0, 12);

    const verificationToken = timestamp + randomToken;
    return verificationToken;
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: {
        id,
        status: ActiveStatusEnum.ACTIVE,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async resendVerifyEmail(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.is_verified === VerifcationStatusEnum.VERIFIED) {
        throw new BadRequestException('User is already verified');
      }

      const verificationUrl = `${process.env.CLIENT_URL}/auth/verify-email/${user.verification_token}`;

      const verificationEmailSubject = 'Verify Your Email Address';
      const verificationEmailBody = `Hello ${user.name},\n\nPlease verify your email address by clicking on the following link:\n\n${verificationUrl}`;

      await this.mailService.sendmail(
        user.email,
        verificationEmailSubject,
        verificationEmailBody,
      );
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  async updateUserById(
    id: string,
    userDto: UpdateUserDto,
  ): Promise<UserEntity> {
    try {
      const user = await this.findById(id);

      const updateduser = {
        ...user,
        ...userDto,
      };

      return await this.userRepository.save(updateduser);
    } catch (error) {
      throw new BadRequestException('Failed to update User');
    }
  }

  async resetPasswordEmail(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const resetToken = await this.generatePasswordResetToken(user.id);
      const resetPasswordUrl = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;

      const resetEmailSubject = 'Reset Your Password';
      const resetEmailBody = `Hello ${user.name},\n\nTo reset your password, please click on the following link:\n\n${resetPasswordUrl}`;
      await this.mailService.sendmail(
        user.email,
        resetEmailSubject,
        resetEmailBody,
      );
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  async generatePasswordResetToken(userId: string): Promise<string> {
    const payload = { userId };

    const expiresIn = '1h';

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn,
    });
    const dto = {
      reset_password_token: token,
    };

    await this.updateUserById(userId, dto);

    return token;
  }

  async resetUserPassword(
    token: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<UserEntity> {
    try {
      const decodedToken = jwt.verify(
        token,
        this.configService.get('JWT_SECRET'),
      ) as { exp: number };

      if (Date.now() > decodedToken.exp * 1000) {
        throw new BadRequestException('Token has expired');
      }

      const user = await this.userRepository.findOne({
        where: {
          reset_password_token: token,
        },
      });

      if (!user) {
        throw new NotFoundException('Invalid or expired token');
      }

      if (newPassword !== confirmNewPassword) {
        throw new BadRequestException(
          "New Password and confirm password don't match",
        );
      }

      const hashedPassword = await this.crypto.hashPassword(newPassword);

      const dto = {
        password: hashedPassword,
        reset_password_token: null,
      };
      return this.updateUserById(user.id, dto);
    } catch (error) {
      throw new BadRequestException('Failed to reset password');
    }
  }

  async changePassword(
    jwtPayload: JwtPayloadInterface,
    previousPassword: string,
    confirmNewPassword: string,
    newPassword: string,
  ) {
    try {
      const user = await this.findById(jwtPayload.id);

      if (!user) {
        throw new NotFoundException('User not found');
      }
      const passwordMatch = await this.crypto.comparePassword(
        previousPassword,
        user.password,
      );

      if (!passwordMatch) {
        throw new BadRequestException('Invalid previous password');
      }

      if (newPassword !== confirmNewPassword) {
        throw new BadRequestException('New passwords do not match');
      }

      const hashedNewPassword = await this.crypto.hashPassword(newPassword);
      user.password = hashedNewPassword;
      await user.save();
    } catch (error) {
      throw new BadRequestException('Failed to reset password');
    }
  }

  async getAll(dto: UserSearchDto): Promise<UserEntity[]> {
    const query = await this.userRepository
      .createQueryBuilder('user')
      .where('user.status = :status', { status: ActiveStatusEnum.ACTIVE });

    if (dto.userName) {
      query.andWhere('lower(user.name) like :userName', {
        userName: `%${dto.userName.toLowerCase()}%`,
      });
    }

    const users = await query.getMany();
    const filteredUsers = users.map((user) =>
      this.userFilterUtil.filterSensitiveFields(user),
    );

    return filteredUsers;
  }

  async getProfile(jwtPayload: JwtPayloadInterface): Promise<UserEntity> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: jwtPayload.id })
      .andWhere('user.status = :userStatus', {
        userStatus: ActiveStatusEnum.ACTIVE,
      })
      .getOne();

    const filteredUser = this.userFilterUtil.filterSensitiveFields(user);

    return filteredUser;
  }

  async update(
    userDto: UpdateUserDto,
    jwtPayload: JwtPayloadInterface,
    profile_image: Express.Multer.File,
  ): Promise<UserEntity> {
    try {
      const user = await this.getProfile(jwtPayload);

      if (profile_image) {
        const s3path = `${user.id}/profile`;
        const s3Response = await this.s3Service.uploadFile(
          profile_image,
          s3path,
        );

        if (s3Response.Location) {
          user.profile_image_url = s3Response.Location;
        } else {
          throw new Error('Failed to get the S3 object URL');
        }
      }

      const updatedWorkspace = {
        ...user,
        ...userDto,
        updated_at: new Date(),
        updated_by: jwtPayload.id,
      };

      const updated = await this.userRepository.save(updatedWorkspace);

      return updated;
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  async removeUserImage(jwtPayload: JwtPayloadInterface): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: jwtPayload.id },
      });
      const imageUrl = user.profile_image_url;

      const urlParts = imageUrl.split('/');

      const key = urlParts.slice(3).join('/');

      await this.s3Service.deleteFileFromS3(key);

      user.profile_image_url = null;
      await user.save();

      return this.userFilterUtil.filterSensitiveFields(user);
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  async findByIds(userIds: string[]): Promise<UserEntity[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder.where('user.id IN (:...userIds)', { userIds });

    const users = await queryBuilder.getMany();

    if (users.length !== userIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    return users;
  }

  async logOut(userId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (user.refresh_token === null) {
        throw new BadRequestException('You are already logged out!');
      }
      user.refresh_token = null;
      user.save();
      return this.userFilterUtil.filterSensitiveFields(user);
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }
}
