import { IsDateString, IsNotEmpty } from 'class-validator';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';
import { MilestoneEntity } from 'src/milestone/entities/milestone.entity/milestone.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from '../../../common/common-entities/custom-base.enity';
import { TrackerEntity } from '../../../tracker/entities/tracker.entity/tracker.entity';

@Entity('tasks')
export class TaskEntity extends CustomBaseEntity {
  @Column({ type: 'varchar', name: 'title', length: 100 })
  @IsNotEmpty()
  title: string;

  @Column({
    type: 'enum',
    enum: TaskStatusEnum,
    name: 'is_done',
    default: `${TaskStatusEnum.PENDING}`,
  })
  is_done: TaskStatusEnum;

  @Column({
    name: 'completion_date',
    nullable: true,
  })
  @IsDateString()
  completion_date: Date;

  @ManyToOne(() => TrackerEntity, (trackerEntity) => trackerEntity.tasks)
  @JoinColumn({ name: 'tracker_id' })
  tracker: TrackerEntity;

  @ManyToOne(() => MilestoneEntity, (milestoneEntity) => milestoneEntity.tasks)
  @JoinColumn({ name: 'milestone_id' })
  milestone: MilestoneEntity;
}
