import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { MilestoneEntity } from '../entities/milestone.entity/milestone.entity';

// @EntityRepository(AdminUser)
@Injectable()
export class MilestoneRepository extends Repository<MilestoneEntity> {
  constructor(private dataSource: DataSource) {
    super(MilestoneEntity, dataSource.createEntityManager());
  }
}
