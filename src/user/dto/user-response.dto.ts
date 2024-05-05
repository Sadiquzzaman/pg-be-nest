import { LocalAuthUserDto } from 'src/auth/dto/local-auth-user.dto';
import { VerifcationStatusEnum } from 'src/common/enums/verification.enum';

export class UserReponseDto extends LocalAuthUserDto {
  id: string;
  is_verified: VerifcationStatusEnum;
  access_token: string;
  refresh_token: string;
}
