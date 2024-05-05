import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OwnerEnum } from 'src/common/enums/owner.enum';

export class WorkspaceMembersSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(OwnerEnum)
  is_owner: OwnerEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Must be a string' })
  userName: string;
}
