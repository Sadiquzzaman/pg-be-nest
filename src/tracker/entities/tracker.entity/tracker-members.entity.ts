import { OwnerEnum } from 'src/common/enums/owner.enum';
import { UserEntity } from 'src/user/entities/user.entity/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TrackerEntity } from './tracker.entity';

@Entity('tracker_members')
export class TrackerMembersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.trackerMembers)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(
    () => TrackerEntity,
    (trackerEntity) => trackerEntity.trackerMembers,
  )
  @JoinColumn({ name: 'tracker_id' })
  tracker: TrackerEntity;

  @Column({
    type: 'enum',
    name: 'is_owner',
    enum: OwnerEnum,
    nullable: false,
    default: OwnerEnum.NOT_OWNER,
  })
  is_owner: OwnerEnum;
}
