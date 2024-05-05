import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { TaskTypeEnum } from 'src/common/enums/task-type.enum';
import { MilestoneEntity } from 'src/milestone/entities/milestone.entity/milestone.entity';

export class TargetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'Target should be an integer!' })
  achieved_target: number;

  @ApiPropertyOptional()
  @IsOptional()
  achieved_date: Date;

  @ApiProperty()
  @IsEnum(TaskTypeEnum, { message: 'Invalid target type' })
  target_type: TaskTypeEnum;

  @ApiProperty()
  @IsNotEmpty({ message: 'Tracker ID must be defined' })
  @IsUUID('all', { message: 'Tracker ID must be an UUID' })
  tracker_id: string;

  @ApiPropertyOptional({ type: () => MilestoneEntity })
  @IsOptional()
  @ValidateIf((o) => o.target_type === TaskTypeEnum.MILESTONE)
  milestone: MilestoneEntity;
}
