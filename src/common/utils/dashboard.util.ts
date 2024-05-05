import { Injectable } from '@nestjs/common';
import { TaskEntity } from 'src/task/entities/task.entity/task.entity';
import { TaskStatusEnum } from '../enums/task-status.enum';
import { ProgressStatusEnum } from '../enums/progress-status.enum';
import { TrackerEntity } from 'src/tracker/entities/tracker.entity/tracker.entity';

@Injectable()
export class DashboardUtil {
  calculateTotalTask(tasks: TaskEntity[]): any {
    return tasks.length;
  }

  calculateDoneTask(tasks: TaskEntity[]): any {
    let doneTask = 0;
    tasks.forEach((task) => {
      if (task.is_done === TaskStatusEnum.DONE) {
        doneTask++;
      }
    });
    return doneTask;
  }

  calculatePercentage(tasks: TaskEntity[]): number {
    return this.calculateTotalTask(tasks) === 0
      ? 0
      : parseFloat(
          (
            (this.calculateDoneTask(tasks) / this.calculateTotalTask(tasks)) *
            100
          ).toFixed(1),
        );
  }

  calculateStatus(tasks: TaskEntity[], start_date: Date, end_date: Date): any {
    let milestoneStatus: ProgressStatusEnum;

    const lastCompletionDateTimestamp = tasks.reduce((maxDate, task) => {
      if (task.completion_date) {
        const taskCompletionDate = new Date(task.completion_date).getTime();

        if (!isNaN(taskCompletionDate) && taskCompletionDate > maxDate) {
          return taskCompletionDate;
        }
      }

      return maxDate;
    }, 0);

    const lastCompletionDate: Date | null =
      lastCompletionDateTimestamp !== 0
        ? new Date(lastCompletionDateTimestamp)
        : null;

    if (
      lastCompletionDate > end_date ||
      (new Date() > end_date && this.calculatePercentage(tasks)) < 100
    ) {
      milestoneStatus = ProgressStatusEnum.OVERDUE;
    }

    if (
      lastCompletionDate <= end_date &&
      this.calculatePercentage(tasks) === 100
    ) {
      milestoneStatus = ProgressStatusEnum.COMPLETED;
    }

    if (new Date() < end_date && this.calculatePercentage(tasks) < 100) {
      milestoneStatus = ProgressStatusEnum.INPROGRESS;
    }

    if (new Date() < start_date && this.calculatePercentage(tasks) === 0) {
      milestoneStatus = ProgressStatusEnum.NOTSTARTED;
    }
    return milestoneStatus;
  }

  calculateNumericTrackerStatus(tracker: TrackerEntity, percent: number): any {
    let trackerStatus: ProgressStatusEnum;

    const lastCompletionDateTimestamp = tracker.targets.reduce(
      (maxDate, target) => {
        if (target.achieved_date) {
          const targetCompletionDate = new Date(target.achieved_date).getTime();

          if (!isNaN(targetCompletionDate) && targetCompletionDate > maxDate) {
            return targetCompletionDate;
          }
        }

        return maxDate;
      },
      0,
    );

    const lastCompletionDate: Date | null =
      lastCompletionDateTimestamp !== 0
        ? new Date(lastCompletionDateTimestamp)
        : null;

    if (
      lastCompletionDate > tracker.end_date ||
      (new Date() > tracker.end_date && percent) < 100
    ) {
      trackerStatus = ProgressStatusEnum.OVERDUE;
    }

    if (lastCompletionDate <= tracker.end_date && percent >= 100) {
      trackerStatus = ProgressStatusEnum.COMPLETED;
    }

    if (new Date() < tracker.end_date && percent < 100) {
      trackerStatus = ProgressStatusEnum.INPROGRESS;
    }

    if (new Date() < tracker.start_date && percent === 0) {
      trackerStatus = ProgressStatusEnum.NOTSTARTED;
    }

    return trackerStatus;
  }
}
