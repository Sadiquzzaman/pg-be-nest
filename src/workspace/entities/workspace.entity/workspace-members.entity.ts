import { OwnerEnum } from 'src/common/enums/owner.enum';
import { UserEntity } from 'src/user/entities/user.entity/user.entity';
import { WorkspaceEntity } from 'src/workspace/entities/workspace.entity/workspace.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('workspace_members')
export class WorkspaceMembersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.workspaceMembers)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(
    () => WorkspaceEntity,
    (workspaceEntity) => workspaceEntity.workspaceMembers,
  )
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceEntity;

  @Column({
    type: 'enum',
    name: 'is_owner',
    enum: OwnerEnum,
    nullable: false,
  })
  is_owner: OwnerEnum;
}
