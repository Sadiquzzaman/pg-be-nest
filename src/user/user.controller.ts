import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { UserPayload } from 'src/common/decorators/user-payload.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserService } from './user.service';
import { UserSearchDto } from './dto/user-search.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiFile } from 'src/common/decorators/api-file.decorator';

@ApiTags('User')
@ApiBearerAuth('jwt')
@Controller({
  path: 'user',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async resetPassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      await this.userService.changePassword(
        jwtPayload,
        changePasswordDto.previousPassword,
        changePasswordDto.confirmNewPassword,
        changePasswordDto.newPassword,
      );
      return { message: 'Password changed successfully', payload: true };
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ summary: 'Get list of users' })
  @Get()
  async getAll(@Query() dto: UserSearchDto) {
    try {
      const payload = await this.userService.getAll(dto);

      return { message: 'User List!', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  @ApiOperation({ summary: 'Get logged in user profile' })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getUserProfile(@UserPayload() jwtPayload: JwtPayloadInterface) {
    try {
      const payload = await this.userService.getProfile(jwtPayload);

      return { message: 'User Profile!', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  @ApiOperation({ summary: 'Update logged in user profile ' })
  @UseGuards(JwtAuthGuard)
  @Patch()
  @ApiFile('profile_image')
  @ApiBody({ type: UpdateUserDto })
  async update(
    @UploadedFile() profile_image: Express.Multer.File,
    @Body() userDto: UpdateUserDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.userService.update(
        userDto,
        jwtPayload,
        profile_image,
      );
      return { message: 'Profile updated successfully!', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  @ApiOperation({ summary: 'Delete logged in users profile picture' })
  @UseGuards(JwtAuthGuard)
  @Put('delete-profile-image')
  async deleteUserImage(@UserPayload() jwtPayload: JwtPayloadInterface) {
    try {
      const payload = await this.userService.removeUserImage(jwtPayload);
      return { message: 'Profile image deleted successfully!', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }
}
