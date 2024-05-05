import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WorkspaceMembersEntity } from '../entities/workspace.entity/workspace-members.entity';

// @EntityRepository(AdminUser)
@Injectable()
export class WorkspaceMembersRepository extends Repository<WorkspaceMembersEntity> {
  constructor(private dataSource: DataSource) {
    super(WorkspaceMembersEntity, dataSource.createEntityManager());
  }
}
