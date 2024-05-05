import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { TaskService } from './task.service';
import { TaskDto } from './dto/task.dto';
import { UserPayload } from 'src/common/decorators/user-payload.decorator';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskTypeEnum } from 'src/common/enums/task-type.enum';
import { GetTaskDto } from './dto/get-task.dto';

@ApiTags('Task')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'task',
  version: '1',
})
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(
    @Body() dto: TaskDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.taskService.create(dto, jwtPayload);

      return { message: 'Task created successfully!', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  @Get()
  async getAllByTracker(@Query() query: GetTaskDto) {
    try {
      if (query.task_type === TaskTypeEnum.TRACKER) {
        const payload = await this.taskService.getAllByTrackerId(
          query.tracker_id,
        );
        return { message: 'All Tasks List!', payload };
      } else if (query.task_type === TaskTypeEnum.MILESTONE) {
        const payload = await this.taskService.getAllByMilestoneId(
          query.milestone_id,
          query.tracker_id,
        );
        return { message: 'All Tasks List!', payload };
      } else {
        throw new BadRequestException('Invalid task type');
      }
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @Patch(':id')
  @ApiParam({ name: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.taskService.update(id, dto, jwtPayload);

      return { message: 'Task updated successfully!', payload };
    } catch (error) {
      throw new BadRequestException('Task updated failed!');
    }
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  async findById(@Param('id') id: string) {
    try {
      const task = await this.taskService.findById(id);
      if (!task) {
        throw new NotFoundException('Task not found');
      }
      return { payload: task };
    } catch {
      throw new NotFoundException('Task not found');
    }
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    await this.taskService.remove(id, jwtPayload);
    return { message: 'Task deleted successfully!', payload: true };
  }

  @Patch('drag-and-drop/:id')
  async dragAndDrop(
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    await this.taskService.handleDragAndDrop(taskId, dto, jwtPayload);
    return { message: 'Successful!', payload: true };
  }
}
