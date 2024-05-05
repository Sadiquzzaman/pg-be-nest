import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { TaskTypeEnum } from 'src/common/enums/task-type.enum';

export class GetTaskDto {
  @ApiProperty()
  @IsEnum(TaskTypeEnum, { message: 'Invalid task type' })
  task_type: TaskTypeEnum;

  @ApiProperty()
  @IsNotEmpty({ message: 'Tracker ID must be defined' })
  @IsUUID('all', { message: 'Tracker ID must be an UUID' })
  tracker_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all', { message: 'Milestone ID must be an UUID' })
  @ValidateIf((o) => o.task_type === TaskTypeEnum.MILESTONE)
  milestone_id: string;
}
