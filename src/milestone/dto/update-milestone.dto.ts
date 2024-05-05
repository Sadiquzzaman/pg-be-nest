import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, ValidateIf } from 'class-validator';
import { MilestoneDto } from './milestone.dto';

export class UpdateMilestoneDto extends PartialType(MilestoneDto) {
  @ApiPropertyOptional()
  @IsInt({ message: 'Target end should be an integer!' })
  @ValidateIf((o) => o.type === 'NUMERIC')
  achieved_target: number;
}
