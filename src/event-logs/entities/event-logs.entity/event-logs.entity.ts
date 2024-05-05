import { IsDateString, IsNotEmpty } from 'class-validator';
import { EventForEnum } from 'src/common/enums/event-for.enum';
import { EventTypeEnum } from 'src/common/enums/event-type.enum';
import { UserEntity } from 'src/user/entities/user.entity/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('event_logs')
export class EventLogsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    name: 'event_for',
    enum: EventForEnum,
    nullable: false,
  })
  @IsNotEmpty()
  event_for: EventForEnum;

  @Column({
    type: 'enum',
    name: 'event_type',
    enum: EventTypeEnum,
    nullable: false,
  })
  @IsNotEmpty()
  event_type: EventTypeEnum;

  @Column({ type: 'varchar', name: 'event_reference', length: 100 })
  @IsNotEmpty()
  event_reference: string;

  @Column({ type: 'text', name: 'message' })
  @IsNotEmpty()
  message: string;

  @Column({
    name: 'created_at',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  @IsNotEmpty()
  @IsDateString()
  created_at: Date | null;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.eventLogs)
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity;
}
