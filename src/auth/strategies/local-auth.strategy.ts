import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { LocalAuthUserDto } from '../dto/local-auth-user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const localAuthUser: LocalAuthUserDto = {
      email,
      password,
    };
    const user = await this.authService.validateLocalStrategyUser(
      localAuthUser,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
