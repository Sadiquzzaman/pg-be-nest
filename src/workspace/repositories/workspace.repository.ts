import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WorkspaceEntity } from '../entities/workspace.entity/workspace.entity';

// @EntityRepository(AdminUser)
@Injectable()
export class WorkspaceRepository extends Repository<WorkspaceEntity> {
  constructor(private dataSource: DataSource) {
    super(WorkspaceEntity, dataSource.createEntityManager());
  }
}
