import { Module } from '@nestjs/common';
import { EventLogsModule } from 'src/event-logs/event-logs.module';
import { UserModule } from 'src/user/user.module';
import { WorkspaceMembersRepository } from './repositories/workspace-members.repository';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { TrackerRepository } from 'src/tracker/repositories/tracker.repository';
import { WorkspaceMembersController } from './workspace-members.controller';

@Module({
  imports: [UserModule, EventLogsModule],
  controllers: [WorkspaceController, WorkspaceMembersController],
  providers: [
    WorkspaceService,
    WorkspaceRepository,
    WorkspaceMembersRepository,
    WorkspaceMembersService,
  ],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
