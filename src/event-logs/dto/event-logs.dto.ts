import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EventForEnum } from 'src/common/enums/event-for.enum';
import { EventTypeEnum } from 'src/common/enums/event-type.enum';

export class EventLogsDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Event For is mandatory' })
  @IsString({ message: 'Event For must be a string' })
  @IsEnum(EventForEnum)
  event_for: EventForEnum;

  @ApiProperty()
  @IsNotEmpty({ message: 'Event Type is mandatory' })
  @IsString({ message: 'Event Type must be a string' })
  @IsEnum(EventTypeEnum)
  event_type: EventTypeEnum;

  @ApiProperty()
  @IsNotEmpty({ message: 'Must be non empty' })
  @IsString({ message: 'Must be a string' })
  @MaxLength(100, { message: 'Maximum 100 characters supported' })
  event_reference: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Message must be non empty' })
  @IsString({ message: 'Message must be a string' })
  message: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'User ID must be defined' })
  @IsUUID('all', { message: 'User ID must be an UUID' })
  created_by: string;
}
