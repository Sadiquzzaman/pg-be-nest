import { Injectable } from '@nestjs/common';
import { UserReponseDto } from 'src/user/dto/user-response.dto';
import { UserService } from 'src/user/user.service';
import { LocalAuthUserDto } from './dto/local-auth-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RefreshAuthUserDto } from './dto/refresh-auth-user.dto';
import { JwtPayloadInterface } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  //register a new user
  async signUp(registerUserDto: RegisterUserDto) {
    await this.userService.create(registerUserDto);
  }

  //validate local user
  async validateLocalStrategyUser(
    localUser: LocalAuthUserDto,
  ): Promise<UserReponseDto> {
    return await this.userService.validateUserEmailPass(localUser);
  }

  async verifyEmailToken(token: string) {
    return await this.userService.verifyEmail(token);
  }

  async resendVerificationEmail(email: string) {
    return await this.userService.resendVerifyEmail(email);
  }

  async resetPasswordEmail(email: string) {
    return await this.userService.resetPasswordEmail(email);
  }

  async resetPassword(token, newPassword, confirmNewPassword) {
    return await this.userService.resetUserPassword(
      token,
      newPassword,
      confirmNewPassword,
    );
  }

  async generateAccessToken(refreshAuthUserDto: RefreshAuthUserDto) {
    return await this.userService.generateAccessToken(
      refreshAuthUserDto.refreshToken,
    );
  }

  async logOut(jwtPayload: JwtPayloadInterface) {
    return this.userService.logOut(jwtPayload.id);
  }
}
