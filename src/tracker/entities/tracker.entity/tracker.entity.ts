import { IsDateString, IsNotEmpty, ValidateIf } from 'class-validator';
import { CustomBaseEntity } from 'src/common/common-entities/custom-base.enity';
import { ArchiveStatusEnum } from 'src/common/enums/archive-status.enum';
import { TrackerTypeEnum } from 'src/common/enums/tracker-type.enum';
import { WorkspaceEntity } from 'src/workspace/entities/workspace.entity/workspace.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { TrackerMembersEntity } from './tracker-members.entity';
import { MilestoneEntity } from 'src/milestone/entities/milestone.entity/milestone.entity';
import { TaskEntity } from 'src/task/entities/task.entity/task.entity';
import { TargetEntity } from 'src/target/entities/target.entity/target.entity';
import { ProgressStatusEnum } from 'src/common/enums/progress-status.enum';

@Entity('tracker')
export class TrackerEntity extends CustomBaseEntity {
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
    type: 'enum',
    name: 'type',
    enum: TrackerTypeEnum,
    nullable: false,
  })
  @IsNotEmpty()
  type: TrackerTypeEnum;

  @Column({
    type: 'int',
    name: 'target_start',
    nullable: true,
  })
  @ValidateIf((o) => o.type === TrackerTypeEnum.NUMERIC)
  target_start: number;

  @Column({
    type: 'int',
    name: 'target_end',
    nullable: true,
  })
  @ValidateIf((o) => o.type === TrackerTypeEnum.NUMERIC)
  target_end: number;

  @Column({
    type: 'int',
    name: 'achieved_target',
    nullable: true,
  })
  @ValidateIf((o) => o.type === TrackerTypeEnum.NUMERIC)
  achieved_target: number;

  @Column({
    type: 'int',
    name: 'total_task',
    nullable: true,
  })
  total_task: number;

  @Column({
    type: 'int',
    name: 'done_task',
    nullable: true,
  })
  done_task: number;

  @Column({
    type: 'float',
    name: 'done_percentage',
    nullable: true,
  })
  percentage: number;

  @Column({
    type: 'enum',
    name: 'is_archived',
    enum: ArchiveStatusEnum,
    default: `${ArchiveStatusEnum.NOT_ARCHIVE}`,
  })
  is_archived: ArchiveStatusEnum;

  @Column({
    type: 'boolean',
    name: 'is_enabled',
    default: true,
  })
  @ValidateIf((o) => o.type === TrackerTypeEnum.NUMERIC)
  is_enabled: boolean;

  @Column({
    type: 'enum',
    name: 'progress_status',
    enum: ProgressStatusEnum,
    default: `${ProgressStatusEnum.NOTSTARTED}`,
  })
  progress_status: ProgressStatusEnum;

  @ManyToOne(() => WorkspaceEntity, (workspace) => workspace.trackers)
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceEntity;

  @OneToMany(
    () => TrackerMembersEntity,
    (trackerMembersEntity) => trackerMembersEntity.tracker,
  )
  trackerMembers: TrackerMembersEntity[];

  @OneToMany(
    () => MilestoneEntity,
    (milestoneEntity) => milestoneEntity.tracker,
  )
  milestones: MilestoneEntity[];

  @OneToMany(() => TaskEntity, (taskEntity) => taskEntity.tracker)
  tasks: TaskEntity[];

  @OneToMany(() => TargetEntity, (targetEntity) => targetEntity.tracker)
  targets: TargetEntity[];
}
