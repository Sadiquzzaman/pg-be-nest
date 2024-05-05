import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventLogsModule } from 'src/event-logs/event-logs.module';
import { MilestoneModule } from 'src/milestone/milestone.module';
import { TrackerModule } from 'src/tracker/tracker.module';
import { TaskEntity } from './entities/task.entity/task.entity';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskRepository } from './repositories/task.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity]),
    TrackerModule,
    EventLogsModule,
    MilestoneModule,
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskRepository],
})
export class TaskModule {}
