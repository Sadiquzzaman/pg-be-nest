import { PartialType } from '@nestjs/swagger';
import { TaskDto } from './task.dto';

export class UpdateTaskDto extends PartialType(TaskDto) {}
