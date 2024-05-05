import { IsDateString, IsNotEmpty, ValidateIf } from 'class-validator';
import { TargetEntity } from 'src/target/entities/target.entity/target.entity';
import { TaskEntity } from 'src/task/entities/task.entity/task.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '../../../common/common-entities/custom-base.enity';
import { TrackerEntity } from '../../../tracker/entities/tracker.entity/tracker.entity';
import { TrackerTypeEnum } from 'src/common/enums/tracker-type.enum';
import { ProgressStatusEnum } from 'src/common/enums/progress-status.enum';

@Entity('milestones')
export class MilestoneEntity extends CustomBaseEntity {
  @Column({ type: 'varchar', name: 'title', length: 100 })
  @IsNotEmpty()
  title: string;

  @Column({ type: 'varchar', name: 'description', length: 200, nullable: true })
  description: string;

  @Column({
    name: 'start_date',
    nullable: false,
  })
  @IsNotEmpty()
  @IsDateString()
  start_date: Date;

  @Column({
    name: 'end_date',
    nullable: false,
  })
  @IsDateString()
  end_date: Date;

  @Column({
    type: 'int',
    name: 'target_value',
    nullable: true,
  })
  @ValidateIf((o) => o.type === TrackerTypeEnum.NUMERIC)
  target_value: number;

  @Column({ default: 0, type: 'int', name: 'achieved_target', nullable: true })
  @ValidateIf((o) => o.type === TrackerTypeEnum.NUMERIC)
  achieved_target: number;

  @Column({ default: 0, type: 'int', name: 'remaining_target', nullable: true })
  @ValidateIf((o) => o.type === TrackerTypeEnum.NUMERIC)
  remaining_target: number;

  @Column({
    name: 'last_achieved_date',
    nullable: true,
  })
  @IsDateString()
  @ValidateIf((o) => o.type === TrackerTypeEnum.NUMERIC)
  last_achieved_date: Date;

  @Column({
    type: 'enum',
    name: 'progress_status',
    enum: ProgressStatusEnum,
    default: `${ProgressStatusEnum.NOTSTARTED}`,
  })
  progress_status: ProgressStatusEnum;

  @ManyToOne(() => TrackerEntity, (trackerEntity) => trackerEntity.milestones)
  @JoinColumn({ name: 'tracker_id' })
  tracker: TrackerEntity;

  @OneToMany(() => TaskEntity, (taskEntity) => taskEntity.milestone)
  tasks: TaskEntity[];

  @OneToMany(() => TargetEntity, (targetEntity) => targetEntity.tracker)
  targets: TargetEntity[];
}
