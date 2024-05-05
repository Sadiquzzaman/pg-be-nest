import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { ActiveStatusEnum } from 'src/common/enums/active.enum';
import { EventForEnum } from 'src/common/enums/event-for.enum';
import { EventTypeEnum } from 'src/common/enums/event-type.enum';
import { TrackerTypeEnum } from 'src/common/enums/tracker-type.enum';
import { DashboardUtil } from 'src/common/utils/dashboard.util';
import { EventLogsDto } from 'src/event-logs/dto/event-logs.dto';
import { EventLogsService } from 'src/event-logs/event-logs.service';
import { WorkspaceService } from 'src/workspace/workspace.service';
import { TrackerDto } from './dto/tracker.dto';
import { UpdateTrackerDto } from './dto/update-tracker.dto';
import { TrackerEntity } from './entities/tracker.entity/tracker.entity';
import { TrackerRepository } from './repositories/tracker.repository';

@Injectable()
export class TrackerService {
  constructor(
    private readonly trackerRepository: TrackerRepository,
    private readonly workspaceService: WorkspaceService,
    private readonly eventLogsService: EventLogsService,
    private readonly dashboardUtil: DashboardUtil,
  ) {}

  async create(
    dto: TrackerDto,
    jwtPayload: JwtPayloadInterface,
  ): Promise<TrackerEntity> {
    try {
      const workspace = await this.workspaceService.findById(
        dto.workspace_id,
        jwtPayload,
      );

      const TrackerEntity = {
        ...dto,
        created_at: new Date(),
        created_by: jwtPayload.id,
        workspace: workspace,
      };

      const tracker = await this.trackerRepository.save(TrackerEntity);

      const eventLogsDto: EventLogsDto = {
        event_for: EventForEnum.TRACKER,
        event_type: EventTypeEnum.CREATE,
        event_reference: tracker.id,
        created_by: jwtPayload.id,
        message: `A ${EventForEnum.TRACKER} is ${EventTypeEnum.CREATE}d called ${tracker.title}`,
      };

      await this.eventLogsService.create(eventLogsDto);

      delete tracker.user_ids;

      return tracker;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async getAllByWorkspaceId(
    workspaceId: string,
    jwtPayload: JwtPayloadInterface,
    isArchived: boolean,
  ): Promise<TrackerEntity[]> {
    try {
      const trackers = await this.trackerRepository
        .createQueryBuilder('tracker')
        .leftJoinAndSelect('tracker.milestones', 'milestones')
        .leftJoinAndSelect('tracker.tasks', 'tasks')
        .leftJoinAndSelect('tracker.targets', 'targets')
        .leftJoin('tracker.workspace', 'workspace')
        .leftJoin('tracker.trackerMembers', 'trackerMembers')
        .leftJoin('trackerMembers.user', 'user')
        .where('tracker.status = :status', { status: ActiveStatusEnum.ACTIVE })
        .andWhere('tracker.is_archived = :isArchived', {
          isArchived: isArchived === true ? 1 : 0,
        })
        .andWhere('workspace.id = :workspaceId', { workspaceId: workspaceId })
        .andWhere('user.id = :userId', { userId: jwtPayload.id })
        .orderBy('tracker.created_at', 'DESC')
        .getMany();

      for (const tracker of trackers) {
        if (tracker.type === TrackerTypeEnum.TASK) {
          const {
            totalTask,
            totalDoneTask,
            trackerPercentage,
            progressStatus,
          } = this.calculateTaskSummary(tracker);

          tracker.total_task = totalTask;
          tracker.done_task = totalDoneTask;
          tracker.percentage = trackerPercentage;
          tracker.progress_status = progressStatus;

          delete tracker.tasks;
        } else if (tracker.type === TrackerTypeEnum.NUMERIC) {
          let percentage = 0;
          percentage =
            tracker.target_end === 0
              ? 0
              : parseFloat(
                  (
                    (tracker.achieved_target / tracker.target_end) *
                    100
                  ).toFixed(1),
                );

          tracker.percentage = percentage;

          tracker.progress_status =
            this.dashboardUtil.calculateNumericTrackerStatus(
              tracker,
              percentage,
            );

          delete tracker.targets;
        }
      }

      return trackers;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async findById(
    id: string,
    jwtPayload: JwtPayloadInterface,
  ): Promise<TrackerEntity> {
    const tracker = await this.trackerRepository
      .createQueryBuilder('tracker')
      .leftJoin('tracker.trackerMembers', 'trackerMembers')
      .leftJoin('trackerMembers.user', 'user')
      .leftJoinAndSelect('tracker.milestones', 'milestones')
      .leftJoinAndSelect('milestones.tasks', 'milestoneTasks')
      .leftJoinAndSelect('tracker.tasks', 'tasks')
      .leftJoinAndSelect('tracker.targets', 'targets')
      .andWhere('tracker.status = :status', {
        status: ActiveStatusEnum.ACTIVE,
      })
      .andWhere('tracker.id = :trackerId', { trackerId: id })
      .andWhere('user.id = :userId', { userId: jwtPayload.id })
      .getOne();

    if (!tracker) {
      throw new NotFoundException('Tracker not found');
    }

    tracker.milestones = tracker.milestones.filter(
      (milestone) => milestone.status === 1,
    );
    if (tracker.milestones.length === 0) {
      tracker.milestones = [];
    }

    if (tracker.type === TrackerTypeEnum.TASK) {
      tracker.tasks = tracker.tasks.filter((task) => task.status === 1);

      if (tracker.tasks.length === 0) {
        tracker.tasks = [];
      }

      const { totalTask, totalDoneTask, trackerPercentage, progressStatus } =
        this.calculateTaskSummary(tracker);

      tracker.total_task = totalTask;
      tracker.done_task = totalDoneTask;
      tracker.percentage = trackerPercentage;
      tracker.progress_status = progressStatus;

      tracker.milestones.map((milestone) => {
        const milestoneTasks = milestone.tasks.filter(
          (task) => task.status === 1,
        );
        milestone.progress_status = this.dashboardUtil.calculateStatus(
          milestoneTasks,
          milestone.start_date,
          milestone.end_date,
        );
        milestone.save();
        delete milestone.tasks;
      });
      delete tracker.tasks;
    } else if (tracker.type === TrackerTypeEnum.NUMERIC) {
      const trackerPercentage =
        tracker.target_end === 0
          ? 0
          : parseFloat(
              ((tracker.achieved_target / tracker.target_end) * 100).toFixed(1),
            );

      tracker.percentage = trackerPercentage;
      tracker.progress_status =
        this.dashboardUtil.calculateNumericTrackerStatus(
          tracker,
          trackerPercentage,
        );
      delete tracker.targets;
    }

    await tracker.save();

    return tracker;
  }

  async update(
    id: string,
    trackerDto: UpdateTrackerDto,
    jwtPayload: JwtPayloadInterface,
  ): Promise<TrackerEntity> {
    try {
      const savedTracker = await this.findById(id, jwtPayload);

      const updatedWorkspace = {
        ...savedTracker,
        ...trackerDto,
        updated_at: new Date(),
        updated_by: jwtPayload.id,
      };

      const updatedTracker = await this.trackerRepository.save(
        updatedWorkspace,
      );
      const eventLogsDto: EventLogsDto = {
        event_for: EventForEnum.TRACKER,
        event_type: EventTypeEnum.UPDATE,
        event_reference: updatedTracker.id,
        created_by: jwtPayload.id,
        message: `A ${EventForEnum.TRACKER} is ${EventTypeEnum.UPDATE}d called ${updatedTracker.title}`,
      };

      await this.eventLogsService.create(eventLogsDto);

      return updatedTracker;
    } catch (error) {
      throw new BadRequestException('Failed to update tracker');
    }
  }

  async remove(
    id: string,
    jwtPayload: JwtPayloadInterface,
  ): Promise<TrackerEntity> {
    try {
      const tracker = await this.findById(id, jwtPayload);

      const updatedTracker = {
        ...tracker,
        status: ActiveStatusEnum.INACTIVE,
        updated_by: jwtPayload.id,
        updated_at: new Date(),
      };

      const deleted: TrackerEntity = await this.trackerRepository.save(
        updatedTracker,
      );

      const eventLogsDto: EventLogsDto = {
        event_for: EventForEnum.TRACKER,
        event_type: EventTypeEnum.DELETE,
        event_reference: id,
        created_by: jwtPayload.id,
        message: `A ${EventForEnum.TRACKER} is ${EventTypeEnum.DELETE}d called ${tracker.title}`,
      };

      await this.eventLogsService.create(eventLogsDto);

      return deleted;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete tracker');
    }
  }

  async getById(id: string): Promise<TrackerEntity> {
    const tracker = await this.trackerRepository.findOne({
      where: {
        id,
        status: ActiveStatusEnum.ACTIVE,
      },
      relations: ['milestones'],
    });

    if (!tracker) {
      throw new NotFoundException('Tracker not found');
    }

    return tracker;
  }

  private calculateTaskSummary(tracker: TrackerEntity) {
    const tasks = tracker.tasks.filter((task) => task.status === 1);
    const totalTask = this.dashboardUtil.calculateTotalTask(tasks);
    const totalDoneTask = this.dashboardUtil.calculateDoneTask(tasks);
    const trackerPercentage = this.dashboardUtil.calculatePercentage(tasks);
    const progressStatus = this.dashboardUtil.calculateStatus(
      tasks,
      tracker.start_date,
      tracker.end_date,
    );

    return { totalTask, totalDoneTask, trackerPercentage, progressStatus };
  }
}
