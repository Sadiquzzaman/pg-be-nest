import { Injectable } from '@nestjs/common';
import { MilestoneEntity } from 'src/milestone/entities/milestone.entity/milestone.entity';
import { ProgressStatusEnum } from '../enums/progress-status.enum';

@Injectable()
export class MilestoneStatusUtil {
  calculateMilestoneStatus(milestone: MilestoneEntity): any {
    let milestoneStatus: ProgressStatusEnum;

    if (
      milestone.remaining_target === 0 &&
      milestone.last_achieved_date <= milestone.end_date
    ) {
      milestoneStatus = ProgressStatusEnum.COMPLETED;
    }

    if (
      (milestone.remaining_target > 0 &&
        milestone.last_achieved_date > milestone.end_date &&
        milestone.end_date < new Date()) ||
      milestone.last_achieved_date > milestone.end_date
    ) {
      milestoneStatus = ProgressStatusEnum.OVERDUE;
    }

    if (
      milestone.achieved_target >= 0 &&
      milestone.remaining_target !== 0 &&
      milestone.last_achieved_date < milestone.end_date
    ) {
      milestoneStatus = ProgressStatusEnum.INPROGRESS;
    }

    if (
      milestone.achieved_target === 0 &&
      milestone.start_date > new Date() &&
      new Date() < milestone.end_date
    ) {
      milestoneStatus = ProgressStatusEnum.NOTSTARTED;
    }

    return milestoneStatus;
  }
}
