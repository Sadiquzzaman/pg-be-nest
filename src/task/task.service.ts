import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { ActiveStatusEnum } from 'src/common/enums/active.enum';
import { EventForEnum } from 'src/common/enums/event-for.enum';
import { EventTypeEnum } from 'src/common/enums/event-type.enum';
import { EventLogsDto } from 'src/event-logs/dto/event-logs.dto';
import { MilestoneEntity } from 'src/milestone/entities/milestone.entity/milestone.entity';
import { EventLogsService } from '../event-logs/event-logs.service';
import { MilestoneService } from '../milestone/milestone.service';
import { TrackerService } from '../tracker/tracker.service';
import { TaskDto } from './dto/task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskEntity } from './entities/task.entity/task.entity';
import { TaskRepository } from './repositories/task.repository';
import { TrackerTypeEnum } from 'src/common/enums/tracker-type.enum';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly trackerService: TrackerService,
    private readonly milestoneService: MilestoneService,
    private readonly eventLogsService: EventLogsService,
  ) {}

  async create(
    dto: TaskDto,
    jwtPayload: JwtPayloadInterface,
  ): Promise<TaskEntity> {
    try {
      const tracker = await this.trackerService.findById(
        dto.tracker_id,
        jwtPayload,
      );
      delete dto.tracker_id;

      if (tracker.type === TrackerTypeEnum.NUMERIC) {
        throw new BadRequestException('This tracker is Numeric type');
      }

      let milestone: MilestoneEntity | undefined;
      if (dto.milestone_id) {
        milestone = await this.milestoneService.findById(dto.milestone_id);
        delete dto.milestone_id;
        if (milestone.tracker.id !== tracker.id) {
          throw new BadRequestException('Milestone and tracker does not match');
        }
      }

      const taskEntity: Partial<TaskEntity> = {
        ...dto,
        created_at: new Date(),
        created_by: jwtPayload.id,
        tracker,
        milestone,
      };

      const task = await this.taskRepository.save(taskEntity);

      const eventLogsDto: EventLogsDto = {
        event_for: EventForEnum.TASK,
        event_type: EventTypeEnum.CREATE,
        event_reference: task.tracker.id,
        created_by: jwtPayload.id,
        message: `A ${EventForEnum.TASK} is ${EventTypeEnum.CREATE}d called ${task.title}`,
      };

      await this.eventLogsService.create(eventLogsDto);

      return task;
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  async getAllByTrackerId(trackerId: string): Promise<TaskEntity[]> {
    try {
      const tasks = await this.taskRepository
        .createQueryBuilder('task')
        .leftJoin('task.tracker', 'tracker')
        .leftJoin('task.milestone', 'milestone')
        .where('task.status = :status', { status: ActiveStatusEnum.ACTIVE })
        .andWhere('tracker.id = :trackerId', { trackerId })
        .andWhere('milestone.id IS NULL')
        .orderBy('task.created_at', 'DESC')
        .getMany();

      return tasks;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async getAllByMilestoneId(
    milestoneId: string,
    trackerId: string,
  ): Promise<TaskEntity[]> {
    try {
      const tasks = await this.taskRepository
        .createQueryBuilder('task')
        .leftJoin('task.milestone', 'milestone')
        .leftJoin('task.tracker', 'tracker')
        .where('task.status = :status', { status: ActiveStatusEnum.ACTIVE })
        .andWhere('milestone.id = :milestoneId', { milestoneId })
        .andWhere('tracker.id = :trackerId', { trackerId })
        .orderBy('task.created_at', 'DESC')
        .getMany();

      return tasks;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async findById(id: string): Promise<TaskEntity> {
    const task = await this.taskRepository.findOne({
      where: {
        id,
        status: ActiveStatusEnum.ACTIVE,
      },
      relations: ['tracker', 'milestone'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    id: string,
    taskDto: UpdateTaskDto,
    jwtPayload: JwtPayloadInterface,
  ): Promise<TaskEntity> {
    try {
      const savedTask = await this.findById(id);

      const updatedTask = {
        ...savedTask,
        ...taskDto,
        completion_date:
          taskDto.is_done && taskDto.is_done === TaskStatusEnum.DONE
            ? new Date()
            : null,
        updated_at: new Date(),
        updated_by: jwtPayload.id,
      };

      const task = await this.taskRepository.save(updatedTask);

      let message: string;

      if (taskDto.title && taskDto.title.length > 0) {
        message = `A ${EventForEnum.TASK} is ${EventTypeEnum.UPDATE}d called ${task.title}`;
      } else if (taskDto.is_done === 0) {
        message = `A ${EventForEnum.TASK} is ${EventTypeEnum.REVERT}ed called ${task.title}`;
      } else if (taskDto.is_done === 1) {
        message = `A ${EventForEnum.TASK} is ${EventTypeEnum.COMPLETE}d called ${task.title}`;
      }

      const eventLogsDto: EventLogsDto = {
        event_for: EventForEnum.TASK,
        event_type: EventTypeEnum.UPDATE,
        event_reference: task.tracker.id,
        created_by: jwtPayload.id,
        message,
      };

      await this.eventLogsService.create(eventLogsDto);

      return task;
    } catch (error) {
      throw new BadRequestException('Failed to update task');
    }
  }

  async remove(
    id: string,
    jwtPayload: JwtPayloadInterface,
  ): Promise<TaskEntity> {
    try {
      const task = await this.findById(id);

      const updatedTask = {
        ...task,
        status: ActiveStatusEnum.INACTIVE,
        updated_by: jwtPayload.id,
        updated_at: new Date(),
      };

      const deleted: TaskEntity = await this.taskRepository.save(updatedTask);

      const eventLogsDto: EventLogsDto = {
        event_for: EventForEnum.TASK,
        event_type: EventTypeEnum.DELETE,
        event_reference: deleted.tracker.id,
        created_by: jwtPayload.id,
        message: `A ${EventForEnum.TASK} is ${EventTypeEnum.DELETE}d called ${task.title}`,
      };

      await this.eventLogsService.create(eventLogsDto);

      return deleted;
    } catch (error) {
      throw new BadRequestException('Failed to delete tracker');
    }
  }

  async handleDragAndDrop(
    taskId: string,
    dto: UpdateTaskDto,
    jwtPayload: JwtPayloadInterface,
  ): Promise<TaskEntity> {
    const task = await this.findById(taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (dto.tracker_id && !dto.milestone_id) {
      task.milestone = null;
    } else if (dto.milestone_id) {
      const milestone = await this.milestoneService.findById(dto.milestone_id);
      task.milestone = milestone;
    }

    task.updated_at = new Date();
    task.updated_by = jwtPayload.id;

    await task.save();

    return task;
  }
}
