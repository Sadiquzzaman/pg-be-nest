import { IsEmail, IsNotEmpty } from 'class-validator';
import { CustomBaseEntity } from 'src/common/common-entities/custom-base.enity';
import { AuthTypeEnum } from 'src/common/enums/auth-type.enum';
import { VerifcationStatusEnum } from 'src/common/enums/verification.enum';
import { EventLogsEntity } from 'src/event-logs/entities/event-logs.entity/event-logs.entity';
import { TrackerMembersEntity } from 'src/tracker/entities/tracker.entity/tracker-members.entity';
import { WorkspaceMembersEntity } from 'src/workspace/entities/workspace.entity/workspace-members.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Entity('users')
export class UserEntity extends CustomBaseEntity {
  @Column({ type: 'varchar', length: '50' })
  @IsNotEmpty()
  name: string;

  @Column({ type: 'varchar', length: 100 })
  @Index({ unique: true })
  @IsEmail()
  email: string;

  @Column({
    type: 'varchar',
    name: 'password',
    length: 100,
  })
  password: string;

  @Column({
    type: 'enum',
    enum: VerifcationStatusEnum,
    name: 'is_verified',
    default: `${VerifcationStatusEnum.NOT_VERIFIED}`,
  })
  is_verified: VerifcationStatusEnum;

  @Column({
    type: 'varchar',
    name: 'verification_token',
    length: 1000,
    nullable: true,
  })
  @Index({ unique: true })
  verification_token: string;

  @Column({
    type: 'varchar',
    name: 'refresh_token',
    length: 1000,
    nullable: true,
  })
  @Index({ unique: true })
  refresh_token: string;

  @Column({
    type: 'varchar',
    name: 'reset_password_token',
    length: 1000,
    nullable: true,
  })
  @Index({ unique: true })
  reset_password_token: string;

  @Column({
    name: 'verified_at',
    nullable: true,
  })
  verified_at: Date | null;

  @Column({
    type: 'enum',
    enum: AuthTypeEnum,
    name: 'auth_type',
    default: `${AuthTypeEnum.Local}`,
  })
  auth_type: AuthTypeEnum;

  @Column({
    type: 'varchar',
    name: 'profile_image_url',
    nullable: true,
  })
  profile_image_url: string;

  @OneToMany(
    () => WorkspaceMembersEntity,
    (workspaceMembers) => workspaceMembers.user,
  )
  workspaceMembers: WorkspaceMembersEntity[];

  @OneToMany(
    () => TrackerMembersEntity,
    (trackerMembersEntity) => trackerMembersEntity.user,
  )
  trackerMembers: TrackerMembersEntity[];

  @OneToMany(
    () => EventLogsEntity,
    (eventLogsEntity) => eventLogsEntity.created_by,
  )
  eventLogs: EventLogsEntity[];
}
