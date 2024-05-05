import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TrackerEntity } from '../entities/tracker.entity/tracker.entity';

// @EntityRepository(AdminUser)
@Injectable()
export class TrackerRepository extends Repository<TrackerEntity> {
  constructor(private dataSource: DataSource) {
    super(TrackerEntity, dataSource.createEntityManager());
  }
}
