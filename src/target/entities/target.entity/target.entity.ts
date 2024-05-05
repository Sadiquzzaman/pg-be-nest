import { IsDateString, IsNotEmpty } from 'class-validator';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';
import { MilestoneEntity } from 'src/milestone/entities/milestone.entity/milestone.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { CustomBaseEntity } from '../../../common/common-entities/custom-base.enity';
import { TrackerEntity } from '../../../tracker/entities/tracker.entity/tracker.entity';

@Entity('targets')
export class TargetEntity extends CustomBaseEntity {
  @Column({
    type: 'int',
    name: 'achieved_target',
    nullable: true,
  })
  achieved_target: number;

  @Column({
    name: 'achieved_date',
    nullable: true,
  })
  @IsDateString()
  achieved_date: Date;

  @ManyToOne(() => TrackerEntity, (trackerEntity) => trackerEntity.targets)
  @JoinColumn({ name: 'tracker_id' })
  tracker: TrackerEntity;

  @ManyToOne(
    () => MilestoneEntity,
    (milestoneEntity) => milestoneEntity.targets,
  )
  @JoinColumn({ name: 'milestone_id' })
  milestone: MilestoneEntity;
}
