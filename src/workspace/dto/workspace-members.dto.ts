import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { OwnerEnum } from 'src/common/enums/owner.enum';

export class WorkspaceMembersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(OwnerEnum)
  is_owner: OwnerEnum;

  @ApiProperty()
  @IsNotEmpty({ message: 'Workspace ID must be defined' })
  @IsUUID('all', { message: 'Workspace ID must be an UUID' })
  workspace_id: string;

  @ApiProperty({ type: [String] })
  @IsNotEmpty({ message: 'user IDs must be defined' })
  @IsUUID('all', { each: true, message: 'user IDs must be an array of UUIDs' })
  user_ids: string[];
}
