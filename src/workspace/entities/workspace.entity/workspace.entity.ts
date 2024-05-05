import { IsNotEmpty } from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '../../../common/common-entities/custom-base.enity';
import { TrackerEntity } from '../../../tracker/entities/tracker.entity/tracker.entity';
import { WorkspaceMembersEntity } from './workspace-members.entity';

@Entity('workspace')
export class WorkspaceEntity extends CustomBaseEntity {
  @Column({ type: 'varchar', name: 'title', length: 100 })
  @IsNotEmpty()
  title: string;

  @OneToMany(() => TrackerEntity, (tracker) => tracker.workspace)
  trackers: TrackerEntity[];

  @OneToMany(
    () => WorkspaceMembersEntity,
    (workspaceMembers) => workspaceMembers.workspace,
  )
  workspaceMembers: WorkspaceMembersEntity[];
}
