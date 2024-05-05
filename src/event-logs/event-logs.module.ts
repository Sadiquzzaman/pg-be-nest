import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { EventLogsEntity } from './entities/event-logs.entity/event-logs.entity';
import { EventLogsController } from './event-logs.controller';
import { EventLogsService } from './event-logs.service';
import { EventLogsRepository } from './repositories/event-logs.repository';

@Module({
  imports: [TypeOrmModule.forFeature([EventLogsEntity]), UserModule],
  controllers: [EventLogsController],
  providers: [EventLogsService, EventLogsRepository],
  exports: [EventLogsService],
})
export class EventLogsModule {}
