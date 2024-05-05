import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';
import { TaskTypeEnum } from 'src/common/enums/task-type.enum';

export class TaskDto {
  @ApiProperty({ default: 'Progress Tracker' })
  @IsNotEmpty({ message: 'Must be non empty' })
  @IsString({ message: 'Must be a string' })
  @MaxLength(100, { message: 'Maximum 100 characters supported' })
  title: string;

  @ApiPropertyOptional()
  @IsEnum(TaskStatusEnum)
  is_done: TaskStatusEnum;

  @ApiProperty()
  @IsEnum(TaskTypeEnum, { message: 'Invalid task type' })
  task_type: TaskTypeEnum;

  @ApiProperty()
  @IsNotEmpty({ message: 'Tracker ID must be defined' })
  @IsUUID('all', { message: 'Tracker ID must be an UUID' })
  tracker_id: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Milestone ID must be defined' })
  @IsUUID('all', { message: 'Milestone ID must be an UUID' })
  @ValidateIf((o) => o.task_type === TaskTypeEnum.MILESTONE)
  milestone_id: string;
}
