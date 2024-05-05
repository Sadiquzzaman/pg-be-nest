import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { OwnerEnum } from 'src/common/enums/owner.enum';

export class TrackerMembersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(OwnerEnum)
  is_owner: OwnerEnum;

  @ApiProperty()
  @IsNotEmpty({ message: 'Tracker ID must be defined' })
  @IsUUID('all', { message: 'Tracker ID must be an UUID' })
  tracker_id: string;

  @ApiProperty({ type: [String] })
  @IsNotEmpty({ message: 'user IDs must be defined' })
  @IsUUID('all', { each: true, message: 'user IDs must be an array of UUIDs' })
  user_ids: string[];
}
