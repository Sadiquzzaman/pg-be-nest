import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { EventForEnum } from 'src/common/enums/event-for.enum';
import { EventTypeEnum } from 'src/common/enums/event-type.enum';
import { TaskTypeEnum } from 'src/common/enums/task-type.enum';
import { TrackerTypeEnum } from 'src/common/enums/tracker-type.enum';
import { EventLogsDto } from 'src/event-logs/dto/event-logs.dto';
import { EventLogsService } from 'src/event-logs/event-logs.service';
import { TrackerService } from 'src/tracker/tracker.service';
import { TargetDto } from './dto/target.dto';
import { TargetEntity } from './entities/target.entity/target.entity';
import { TargetRepository } from './repositories/target.repository';
import { UpdateTargetDto } from './dto/update-target.dto';
import { MilestoneEntity } from 'src/milestone/entities/milestone.entity/milestone.entity';
import { TrackerEntity } from 'src/tracker/entities/tracker.entity/tracker.entity';
import { ProgressStatusEnum } from 'src/common/enums/progress-status.enum';

@Injectable()
export class TargetService {
  constructor(
    private readonly targetRepository: TargetRepository,
    private readonly trackerService: TrackerService,
    private readonly eventLogsService: EventLogsService,
  ) {}

  async create(
    dto: TargetDto,
    jwtPayload: JwtPayloadInterface,
  ): Promise<TargetEntity> {
    try {
      const tracker = await this.trackerService.findById(
        dto.tracker_id,
        jwtPayload,
      );
      if (tracker.type === TrackerTypeEnum.TASK) {
        throw new BadRequestException('The tracker is Task based');
      }
      delete dto.tracker_id;

      if (tracker.milestones && tracker.milestones.length > 0) {
        const isAnyActive = await this.isAnyMilestoneActive(tracker);

        if (isAnyActive) {
          tracker.is_enabled = false;
        } else {
          tracker.is_enabled = true;
        }

        if (tracker.is_enabled === false && dto.target_type === 'tracker') {
          throw new BadRequestException('Milstone is active');
        }
      }

      const targetEntity: Partial<TargetEntity> = {
        ...dto,
        achieved_target: dto.achieved_target,
        created_at: new Date(),
        created_by: jwtPayload.id,
        tracker,
      };

      const target = await this.targetRepository.save(targetEntity);

      tracker.achieved_target =
        tracker.achieved_target + target.achieved_target;

      await tracker.save();

      const eventLogsDto: EventLogsDto = {
        event_for: EventForEnum.TARGET,
        event_type: EventTypeEnum.CREATE,
        event_reference: target.tracker.id,
        created_by: jwtPayload.id,
        message: `${target.achieved_target} added`,
      };

      if (dto.target_type === TaskTypeEnum.MILESTONE) {
        eventLogsDto.message += ` in ${target.milestone.title}`;
      }

      await this.eventLogsService.create(eventLogsDto);

      return target;
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  async getTrackerTarget(id: string): Promise<TargetEntity[]> {
    try {
      const targets = await this.targetRepository
        .createQueryBuilder('target')
        .leftJoin('target.milestone', 'milestone')
        .leftJoin('target.tracker', 'tracker')
        .where('milestone.id IS NULL')
        .andWhere('tracker.id = :trackerId', { trackerId: id })
        .getMany();

      return targets;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async update(ids: string[], milestone: MilestoneEntity) {
    try {
      await this.targetRepository
        .createQueryBuilder()
        .update(TargetEntity)
        .set({ milestone: milestone })
        .whereInIds(ids)
        .execute();
    } catch (error) {
      throw new BadRequestException('Failed to update target');
    }
  }

  async isAnyMilestoneActive(tracker: TrackerEntity): Promise<boolean> {
    const currentDate = new Date();

    let isActive = false;

    for (const milestone of tracker.milestones) {
      const milestoneEndDate = new Date(milestone.end_date);

      if (
        milestoneEndDate > currentDate &&
        milestone.progress_status !== ProgressStatusEnum.COMPLETED
      ) {
        isActive = true;
        break;
      }
    }

    return isActive;
  }
}
