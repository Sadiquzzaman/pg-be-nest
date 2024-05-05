import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TrackerMembersEntity } from '../entities/tracker.entity/tracker-members.entity';

// @EntityRepository(AdminUser)
@Injectable()
export class TrackerMembersRepository extends Repository<TrackerMembersEntity> {
  constructor(private dataSource: DataSource) {
    super(TrackerMembersEntity, dataSource.createEntityManager());
  }
}
