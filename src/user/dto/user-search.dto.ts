import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UserSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Must be a string' })
  userName: string;
}
