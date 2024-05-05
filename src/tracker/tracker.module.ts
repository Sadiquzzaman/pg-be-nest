import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventLogsModule } from 'src/event-logs/event-logs.module';
import { UserModule } from 'src/user/user.module';
import { WorkspaceModule } from 'src/workspace/workspace.module';
import { TrackerEntity } from './entities/tracker.entity/tracker.entity';
import { TrackerMembersRepository } from './repositories/tracker-members.repository';
import { TrackerRepository } from './repositories/tracker.repository';
import { TrackerMembersService } from './tracker-members.service';
import { TrackerController } from './tracker.controller';
import { TrackerService } from './tracker.service';
import { TrackerMemberController } from './tracker-member.controller';
import { DashboardUtil } from 'src/common/utils/dashboard.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrackerEntity]),
    WorkspaceModule,
    UserModule,
    EventLogsModule,
  ],
  controllers: [TrackerController, TrackerMemberController],
  providers: [
    TrackerService,
    TrackerRepository,
    TrackerMembersService,
    TrackerMembersRepository,
    DashboardUtil,
  ],
  exports: [TrackerService],
})
export class TrackerModule {}
