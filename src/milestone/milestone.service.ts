import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { ActiveStatusEnum } from 'src/common/enums/active.enum';
import { EventForEnum } from 'src/common/enums/event-for.enum';
import { EventTypeEnum } from 'src/common/enums/event-type.enum';
import { ProgressStatusEnum } from 'src/common/enums/progress-status.enum';
import { TaskTypeEnum } from 'src/common/enums/task-type.enum';
import { TrackerTypeEnum } from 'src/common/enums/tracker-type.enum';
import { MilestoneStatusUtil } from 'src/common/utils/milestone-status.util';
import { EventLogsDto } from 'src/event-logs/dto/event-logs.dto';
import { TargetDto } from 'src/target/dto/target.dto';
import { TargetEntity } from 'src/target/entities/target.entity/target.entity';
import { TargetService } from 'src/target/target.service';
import { TrackerService } from 'src/tracker/tracker.service';
import { DashboardUtil } from '../common/utils/dashboard.util';
import { EventLogsService } from '../event-logs/event-logs.service';
import { MilestoneDto } from './dto/milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { MilestoneEntity } from './entities/milestone.entity/milestone.entity';
import { MilestoneRepository } from './repositories/milestone.repository';

@Injectable()
export class MilestoneService {
  constructor(
    private readonly milestoneRepository: MilestoneRepository,
    private readonly trackerService: TrackerService,
    private readonly eventLogsService: EventLogsService,
    private readonly targetService: TargetService,
    private readonly milestoneStatusUtil: MilestoneStatusUtil,
    private readonly dashboardUtil: DashboardUtil,
  ) {}

  async create(
    dto: MilestoneDto,
    jwtPayload: JwtPayloadInterface,
  ): Promise<MilestoneEntity> {
    try {
      const tracker = await this.trackerService.findById(
        dto.tracker_id,
        jwtPayload,
      );

      const dtoStartDate = new Date(dto.start_date);
      const dtoEndDate = new Date(dto.end_date);
      const trackerStartDate = new Date(tracker.start_date);
      const trackerEndDate = new Date(tracker.end_date);

      if (dtoEndDate < dtoStartDate) {
        throw new BadRequestException(
          'End Date must be equal or greater than ' +
            dto.start_date.toLocaleDateString('en-US'),
        );
      }

      if (dtoStartDate < trackerStartDate) {
        throw new BadRequestException(
          'Start Date must be equal or greater than ' +
            tracker.start_date.toLocaleDateString('en-US'),
        );
      }

      if (dtoStartDate > trackerEndDate) {
        throw new BadRequestException(
          'Start Date must be equal or lesser than ' +
            tracker.end_date.toLocaleDateString('en-US'),
        );
      }

      if (dtoEndDate < trackerStartDate) {
        throw new BadRequestException(
          'End Date must be equal or greater than ' +
            tracker.start_date.toLocaleDateString('en-US'),
        );
      }

      if (dtoEndDate > trackerEndDate) {
        throw new BadRequestException(
          'End Date must be equal or lesser than ' +
            tracker.end_date.toLocaleDateString('en-US'),
        );
      }

      let sumOfAchievedTargets: number,
        lastAchievedDate = null,
        target: TargetEntity[];

      if (dto.tracker_type === TrackerTypeEnum.NUMERIC) {
        const sumOfMilestoneTargetValues: number = tracker.milestones.reduce(
          (sum, milestone) => sum + milestone.target_value,
          0,
        );

        if (tracker.target_end - sumOfMilestoneTargetValues <= 0) {
          throw new BadRequestException(
            `You have exceeded total target value of tracker`,
          );
        } else if (
          tracker.target_end - sumOfMilestoneTargetValues > 0 &&
          dto.target_value > tracker.target_end - sumOfMilestoneTargetValues
        ) {
          throw new BadRequestException(
            `You are exceeding total target value of tracker. You can set target of minimum ${
              tracker.target_end - sumOfMilestoneTargetValues
            }`,
          );
        }

        if (tracker.milestones && tracker.milestones.length > 0) {
          tracker.milestones.sort(
            (a: any, b: any) =>
              (new Date(b.created_at) as any) - (new Date(a.created_at) as any),
          );
        }

        if (dto.target_value > tracker.target_end) {
          throw new BadRequestException(
            `Target Value must be less or equal to ${tracker.target_end}`,
          );
        }

        delete dto.tracker_id;
        target = await this.targetService.getTrackerTarget(tracker.id);

        if (target.length > 0) {
          sumOfAchievedTargets = target.reduce((sum, currentTarget) => {
            return sum + currentTarget.achieved_target;
          }, 0);
        } else {
          sumOfAchievedTargets = 0;
        }
        if (target.length > 0) {
          lastAchievedDate = new Date(
            Math.max.apply(
              null,
              target.map(function (e) {
                return new Date(e.achieved_date);
              }),
            ),
          );
        }
      }

      const MilestoneEntity = {
        ...dto,
        created_at: new Date(),
        created_by: jwtPayload.id,
        tracker: tracker,
        achieved_target:
          dto.tracker_type === TrackerTypeEnum.NUMERIC
            ? sumOfAchievedTargets
            : null,
        remaining_target:
          dto.tracker_type === TrackerTypeEnum.NUMERIC
            ? Math.max(dto.target_value - sumOfAchievedTargets, 0)
            : null,
        last_achieved_date:
          dto.tracker_type === TrackerTypeEnum.NUMERIC
            ? lastAchievedDate
            : null,
      };

      const createMilestoneEntity =
        this.milestoneRepository.create(MilestoneEntity);

      if (dto.tracker_type === TrackerTypeEnum.NUMERIC) {
        createMilestoneEntity.progress_status =
          this.milestoneStatusUtil.calculateMilestoneStatus(
            createMilestoneEntity,
          );
      }

      if (tracker.type === TrackerTypeEnum.NUMERIC) {
        const endDate = new Date(createMilestoneEntity.end_date);
        if (
          new Date() < endDate &&
          createMilestoneEntity.progress_status !== ProgressStatusEnum.COMPLETED
        ) {
          tracker.is_enabled = false;
        }

        await tracker.save();
      }

      const milestone = await this.milestoneRepository.save(
        createMilestoneEntity,
      );

      if (dto.tracker_type === TrackerTypeEnum.NUMERIC) {
        const targetIdsToUpdate = target.map((targetEntity) => targetEntity.id);
        await this.targetService.update(targetIdsToUpdate, milestone);
      }

      const eventLogsDto: EventLogsDto = {
        event_for: EventForEnum.MILESTONE,
        event_type: EventTypeEnum.CREATE,
        event_reference: milestone.tracker.id,
        created_by: jwtPayload.id,
        message: `A ${EventForEnum.MILESTONE} is ${EventTypeEnum.CREATE}d called ${milestone.title}`,
      };

      await this.eventLogsService.create(eventLogsDto);

      return milestone;
    } catch (error) {
      throw new BadRequestException(error.response?.message);
    }
  }

  async getAllMilestoneByTrackerId(
    trackerId: string,
    jwtPayload: JwtPayloadInterface,
  ): Promise<MilestoneEntity[]> {
    try {
      const milestones = await this.milestoneRepository
        .createQueryBuilder('milestone')
        .leftJoinAndSelect('milestone.tasks', 'tasks')
        .leftJoin('milestone.tracker', 'tracker')
        .leftJoin('tracker.trackerMembers', 'trackerMembers')
        .leftJoin('trackerMembers.user', 'user')
        .where('milestone.status = :status', {
          status: ActiveStatusEnum.ACTIVE,
        })
        .andWhere('tracker.id = :trackerId', { trackerId: trackerId })
        .andWhere('user.id = :userId', { userId: jwtPayload.id })
        .getMany();

      milestones.map((milestone) => {
        milestone.progress_status = this.dashboardUtil.calculateStatus(
          milestone.tasks,
          milestone.start_date,
          milestone.end_date,
        );
      });

      return milestones;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async findById(id: string): Promise<MilestoneEntity> {
    const milestone = await this.milestoneRepository.findOne({
      where: {
        id,
        status: ActiveStatusEnum.ACTIVE,
      },
      relations: ['tracker', 'tasks'],
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    milestone.progress_status = this.dashboardUtil.calculateStatus(
      milestone.tasks,
      milestone.start_date,
      milestone.end_date,
    );

    return milestone;
  }

  async update(
    id: string,
    milestoneDto: UpdateMilestoneDto,
    jwtPayload: JwtPayloadInterface,
  ): Promise<MilestoneEntity> {
    try {
      const savedMilestone = await this.findById(id);

      if (
        milestoneDto.tracker_type === TrackerTypeEnum.NUMERIC &&
        milestoneDto.achieved_target > 0
      ) {
        const totalAchieved =
          savedMilestone.achieved_target + milestoneDto.achieved_target;
        savedMilestone.remaining_target = Math.max(
          savedMilestone.target_value - totalAchieved,
          0,
        );

        const endDate = new Date(savedMilestone.end_date);

        if (savedMilestone.remaining_target <= 0 || new Date() < endDate) {
          savedMilestone.progress_status = ProgressStatusEnum.COMPLETED;
        }
      }

      if (milestoneDto.target_value > 0) {
        if (milestoneDto.achieved_target > 0) {
          savedMilestone.remaining_target =
            milestoneDto.target_value -
            (savedMilestone.achieved_target + milestoneDto.achieved_target);
        } else {
          savedMilestone.remaining_target =
            milestoneDto.target_value - savedMilestone.achieved_target;
        }
      }

      const achievedDate = new Date();

      const updatedMilestones = {
        ...savedMilestone,
        ...milestoneDto,
        achieved_target:
          milestoneDto.achieved_target > 0
            ? savedMilestone.achieved_target + milestoneDto.achieved_target
            : savedMilestone.achieved_target,
        last_achieved_date:
          milestoneDto.achieved_target > 0
            ? achievedDate
            : savedMilestone.last_achieved_date,
        updated_at: new Date(),
        updated_by: jwtPayload.id,
      };

      const updatedMilestone = await this.milestoneRepository.save(
        updatedMilestones,
      );

      if (
        milestoneDto.tracker_type === TrackerTypeEnum.NUMERIC &&
        milestoneDto.achieved_target > 0
      ) {
        updatedMilestone.progress_status =
          await this.milestoneStatusUtil.calculateMilestoneStatus(
            updatedMilestone,
          );
      }

      await this.milestoneRepository.save(updatedMilestone);

      if (
        milestoneDto.tracker_type === TrackerTypeEnum.NUMERIC &&
        milestoneDto.achieved_target > 0
      ) {
        const targetDto: TargetDto = {
          achieved_target: milestoneDto.achieved_target,
          achieved_date: achievedDate,
          target_type: TaskTypeEnum.MILESTONE,
          tracker_id: updatedMilestone.tracker.id,
          milestone: updatedMilestone,
        };

        await this.targetService.create(targetDto, jwtPayload);
      }

      if (milestoneDto.title && milestoneDto.title.length > 0) {
        const eventLogsDto: EventLogsDto = {
          event_for: EventForEnum.MILESTONE,
          event_type: EventTypeEnum.UPDATE,
          event_reference: updatedMilestone.tracker.id,
          created_by: jwtPayload.id,
          message: `A ${EventForEnum.MILESTONE} name is ${EventTypeEnum.UPDATE}d called ${updatedMilestone.title}`,
        };
        await this.eventLogsService.create(eventLogsDto);
      }

      return updatedMilestone;
    } catch (error) {
      throw new BadRequestException('Failed to update milestone');
    }
  }

  async remove(
    id: string,
    jwtPayload: JwtPayloadInterface,
  ): Promise<MilestoneEntity> {
    try {
      const milestone = await this.findById(id);

      const updatedMilestone = {
        ...milestone,
        status: ActiveStatusEnum.INACTIVE,
        updated_by: jwtPayload.id,
        updated_at: new Date(),
      };

      const deleted: MilestoneEntity = await this.milestoneRepository.save(
        updatedMilestone,
      );

      const eventLogsDto: EventLogsDto = {
        event_for: EventForEnum.MILESTONE,
        event_type: EventTypeEnum.DELETE,
        event_reference: deleted.tracker.id,
        created_by: jwtPayload.id,
        message: `A ${EventForEnum.MILESTONE} is ${EventTypeEnum.DELETE}d called ${milestone.title}`,
      };

      await this.eventLogsService.create(eventLogsDto);

      return deleted;
    } catch (error) {
      throw new BadRequestException('Failed to delete tracker');
    }
  }
}
