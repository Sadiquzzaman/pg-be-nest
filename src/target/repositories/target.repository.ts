import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TargetEntity } from '../entities/target.entity/target.entity';

// @EntityRepository(AdminUser)
@Injectable()
export class TargetRepository extends Repository<TargetEntity> {
  constructor(private dataSource: DataSource) {
    super(TargetEntity, dataSource.createEntityManager());
  }
}
