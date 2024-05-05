import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
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

export class MilestoneDto {
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
  tracker_type: TrackerTypeEnum;

  @ApiProperty()
  @IsInt({ message: 'Target end should be an integer!' })
  @IsNotEmpty({ message: 'Target start is mandatory for numeric tracker type' })
  @ValidateIf((o) => o.tracker_type === 'NUMERIC')
  target_value: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Tracker ID must be defined' })
  @IsUUID('all', { message: 'Tracker ID must be an UUID' })
  tracker_id: string;
}
