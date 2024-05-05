import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EventLogsEntity } from '../entities/event-logs.entity/event-logs.entity';

@Injectable()
export class EventLogsRepository extends Repository<EventLogsEntity> {
  constructor(private dataSource: DataSource) {
    super(EventLogsEntity, dataSource.createEntityManager());
  }
}
