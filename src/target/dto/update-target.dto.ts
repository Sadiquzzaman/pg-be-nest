import { PartialType } from '@nestjs/swagger';
import { TargetDto } from './target.dto';

export class UpdateTargetDto extends PartialType(TargetDto) {}
