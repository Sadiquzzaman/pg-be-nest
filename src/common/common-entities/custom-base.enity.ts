import { BaseEntity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ActiveStatusEnum } from '../enums/active.enum';

export class CustomBaseEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    name: 'status',
    enum: ActiveStatusEnum,
    default: `${ActiveStatusEnum.ACTIVE}`,
  })
  status: ActiveStatusEnum;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by: string | null;

  @Column({ type: 'uuid', name: 'updated_by', nullable: true })
  updated_by: string | null;

  @Column({
    name: 'created_at',
    nullable: true,
  })
  created_at: Date | null;

  @Column({
    name: 'updated_at',
    nullable: true,
  })
  updated_at: Date | null;
}
