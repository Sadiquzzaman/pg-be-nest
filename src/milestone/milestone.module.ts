import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventLogsModule } from 'src/event-logs/event-logs.module';
import { TrackerModule } from 'src/tracker/tracker.module';
import { MilestoneEntity } from './entities/milestone.entity/milestone.entity';
import { MilestoneController } from './milestone.controller';
import { MilestoneService } from './milestone.service';
import { MilestoneRepository } from './repositories/milestone.repository';
import { TargetModule } from 'src/target/target.module';
import { MilestoneStatusUtil } from 'src/common/utils/milestone-status.util';
import { DashboardUtil } from 'src/common/utils/dashboard.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([MilestoneEntity]),
    TrackerModule,
    EventLogsModule,
    TargetModule,
  ],
  controllers: [MilestoneController],
  providers: [
    MilestoneService,
    MilestoneRepository,
    MilestoneStatusUtil,
    DashboardUtil,
  ],
  exports: [MilestoneService],
})
export class MilestoneModule {}
