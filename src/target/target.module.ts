import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MilestoneModule } from 'src/milestone/milestone.module';
import { TrackerModule } from 'src/tracker/tracker.module';
import { TargetEntity } from './entities/target.entity/target.entity';
import { TargetRepository } from './repositories/target.repository';
import { TargetController } from './target.controller';
import { TargetService } from './target.service';
import { EventLogsModule } from 'src/event-logs/event-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TargetEntity]),
    TrackerModule,
    EventLogsModule,
  ],
  controllers: [TargetController],
  providers: [TargetService, TargetRepository],
  exports: [TargetService],
})
export class TargetModule {}
