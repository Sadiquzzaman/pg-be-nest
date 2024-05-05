import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserPayload } from 'src/common/decorators/user-payload.decorator';
import { AuthService } from './auth.service';
import { LocalAuthUserDto } from './dto/local-auth-user.dto';
import { RefreshAuthUserDto } from './dto/refresh-auth-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { JwtPayloadInterface } from './interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    const payload = await this.authService.signUp(registerUserDto);
    return { message: 'Registered successfully!', payload };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() localUser: LocalAuthUserDto) {
    const payload = await this.authService.validateLocalStrategyUser(localUser);
    return { message: 'Loged in successful!', payload };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    try {
      const payload = await this.authService.verifyEmailToken(token);
      return { message: 'Email successfully verified!', payload };
    } catch (error) {
      throw new NotFoundException('Invalid or expired token');
    }
  }

  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @Get('verify-auth-guard')
  async test(@UserPayload() jwtPayload: JwtPayloadInterface) {
    return { payload: jwtPayload };
  }

  @Post('resend-verification')
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    try {
      await this.authService.resendVerificationEmail(
        resendVerificationDto.email,
      );
      return {
        message: 'Verification email sent successfully!',
        payload: true,
      };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  @Post('request-password-reset')
  async requestPasswordReset(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    try {
      await this.authService.resetPasswordEmail(resendVerificationDto.email);
      return {
        message: 'Verification email sent successfully!',
        payload: true,
      };
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.confirmNewPassword,
        resetPasswordDto.newPassword,
      );
      return { message: 'Password reset successful', payload: true };
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @ApiBearerAuth('jwt')
  @UseGuards(RefreshAuthGuard)
  @Post('refresh-token')
  async refreshToken(@Body() refreshAuthUserDto: RefreshAuthUserDto) {
    const payload = await this.authService.generateAccessToken(
      refreshAuthUserDto,
    );
    return { message: 'New access token generated successfully', payload };
  }

  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async logout(@UserPayload() jwtPayload: JwtPayloadInterface) {
    try {
      const payload = await this.authService.logOut(jwtPayload);
      return { message: 'Log Out Successful', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }
}
