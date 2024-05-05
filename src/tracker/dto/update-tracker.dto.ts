import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TrackerDto } from './tracker.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ArchiveStatusEnum } from 'src/common/enums/archive-status.enum';

export class UpdateTrackerDto extends PartialType(TrackerDto) {
  @ApiPropertyOptional({ enum: ArchiveStatusEnum })
  @IsOptional()
  @IsEnum(ArchiveStatusEnum)
  is_archived: ArchiveStatusEnum;
}
