import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TrackerTypeEnum } from 'src/common/enums/tracker-type.enum';

export class TrackerDto {
  @ApiProperty({ default: 'Progress Tracker' })
  @IsNotEmpty({ message: 'Must be non empty' })
  @IsString({ message: 'Must be a string' })
  @MaxLength(100, { message: 'Maximum 100 characters supported' })
  title: string;

  @ApiPropertyOptional({ default: 'Progress Tracker' })
  @IsOptional()
  @IsString({ message: 'Must be a string' })
  @MaxLength(200, { message: 'Maximum 200 characters supported' })
  description: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Start date is mandatory' })
  start_date: Date;

  @ApiProperty()
  @IsNotEmpty({ message: 'End date is mandatory' })
  end_date: Date;

  @ApiProperty()
  @IsNotEmpty({ message: 'Tracker Type is mandatory' })
  @IsString({ message: 'Must be a string' })
  @IsEnum(TrackerTypeEnum)
  type: TrackerTypeEnum;

  @ApiProperty()
  @IsInt({ message: 'Target end should be an integer!' })
  @IsNotEmpty({ message: 'Target start is mandatory for numeric tracker type' })
  @ValidateIf((o) => o.type === 'NUMERIC')
  target_start: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Target end is mandatory for numeric tracker type' })
  @IsInt({ message: 'Target end should be an integer!' })
  @ValidateIf((o) => o.type === 'NUMERIC')
  target_end: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Workspace ID must be defined' })
  @IsUUID('all', { message: 'Workspace ID must be an UUID' })
  workspace_id: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID('all', { each: true, message: 'user IDs must be an array of UUIDs' })
  user_ids: string[];
}
