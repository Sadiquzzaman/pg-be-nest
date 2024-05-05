import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { ActiveStatusEnum } from 'src/common/enums/active.enum';
import { EventForEnum } from 'src/common/enums/event-for.enum';
import { EventTypeEnum } from 'src/common/enums/event-type.enum';
import { OwnerEnum } from 'src/common/enums/owner.enum';
import { EventLogsDto } from 'src/event-logs/dto/event-logs.dto';
import { EventLogsService } from '../event-logs/event-logs.service';
import { UserService } from '../user/user.service';
import { WorkspaceDto } from './dto/workspace.dto';
import { WorkspaceMembersEntity } from './entities/workspace.entity/workspace-members.entity';
import { WorkspaceEntity } from './entities/workspace.entity/workspace.entity';
import { WorkspaceRepository } from './repositories/workspace.repository';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly userService: UserService,
    private readonly eventLogsService: EventLogsService,
  ) {}

  async create(
    workspaceDto: WorkspaceDto,
    jwtPayload: JwtPayloadInterface,
  ): Promise<WorkspaceEntity> {
    const workspaceEntity = {
      ...workspaceDto,
      created_at: new Date(),
      created_by: jwtPayload.id,
    };

    const workspace = await this.workspaceRepository.save(workspaceEntity);

    const workspaceMembers = new WorkspaceMembersEntity();
    workspaceMembers.is_owner = OwnerEnum.OWNER;
    workspaceMembers.workspace = workspace;
    workspaceMembers.user = await this.userService.findById(jwtPayload.id);

    const eventLogsDto: EventLogsDto = {
      event_for: EventForEnum.WORKSPACE,
      event_type: EventTypeEnum.CREATE,
      event_reference: workspace.id,
      created_by: jwtPayload.id,
      message: `A ${EventForEnum.WORKSPACE} is ${EventTypeEnum.CREATE}d called ${workspace.title}`,
    };

    await this.eventLogsService.create(eventLogsDto);

    return workspace;
  }

  async getAll(jwtPayload: JwtPayloadInterface): Promise<WorkspaceEntity[]> {
    const workspaces = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoin('workspace.workspaceMembers', 'workspaceMembers')
      .leftJoin('workspaceMembers.user', 'user')
      .where('workspace.status = :status', { status: ActiveStatusEnum.ACTIVE })
      .andWhere('user.id = :userId', { userId: jwtPayload.id })
      .orderBy('workspace.created_at', 'DESC')
      .getMany();

    return workspaces;
  }

  async findById(
    id: string,
    jwtPayload: JwtPayloadInterface,
  ): Promise<WorkspaceEntity> {
    const workspace = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoin('workspace.workspaceMembers', 'workspaceMembers')
      .leftJoin('workspaceMembers.user', 'user')
      .leftJoinAndSelect('workspace.trackers', 'trackers')
      .leftJoin('trackers.trackerMembers', 'trackerMembers')
      .leftJoin('trackerMembers.user', 'trackerUser')
      .where('workspace.status = :status', { status: ActiveStatusEnum.ACTIVE })
      .andWhere('workspace.id = :workspaceId', { workspaceId: id })
      .andWhere('user.id = :userId', { userId: jwtPayload.id })
      .andWhere('(trackerUser.id IS NULL OR trackerUser.id = :userId)', {
        userId: jwtPayload.id,
      })
      .getOne();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    workspace.trackers = workspace.trackers.filter(
      (tracker) => tracker.status === 1 && tracker.is_archived === 0,
    );
    if (workspace.trackers.length === 0) {
      workspace.trackers = [];
    }

    return workspace;
  }

  async update(
    id: string,
    workspaceDto: WorkspaceDto,
    jwtPayload: JwtPayloadInterface,
  ): Promise<WorkspaceEntity> {
    try {
      const workspace = await this.findById(id, jwtPayload);

      const updatedWorkspace = {
        ...workspace,
        ...workspaceDto,
        updated_at: new Date(),
        updated_by: jwtPayload.id,
      };

      const updated = await this.workspaceRepository.save(updatedWorkspace);

      const eventLogsDto: EventLogsDto = {
        event_for: EventForEnum.WORKSPACE,
        event_type: EventTypeEnum.UPDATE,
        event_reference: workspace.id,
        created_by: jwtPayload.id,
        message: `A ${EventForEnum.WORKSPACE} is ${EventTypeEnum.UPDATE}d from ${workspace.title} to ${updated.title}`,
      };

      await this.eventLogsService.create(eventLogsDto);

      return updated;
    } catch (error) {
      throw new BadRequestException('Failed to update workspace');
    }
  }

  async remove(
    id: string,
    jwtPayload: JwtPayloadInterface,
  ): Promise<WorkspaceEntity> {
    try {
      const workspace = await this.findById(id, jwtPayload);

      const updatedWorkspace = {
        ...workspace,
        status: ActiveStatusEnum.INACTIVE,
        updated_by: jwtPayload.id,
        updated_at: new Date(),
      };

      const deleted: WorkspaceEntity = await this.workspaceRepository.save(
        updatedWorkspace,
      );

      const eventLogsDto: EventLogsDto = {
        event_for: EventForEnum.WORKSPACE,
        event_type: EventTypeEnum.UPDATE,
        event_reference: workspace.id,
        created_by: jwtPayload.id,
        message: `A ${EventForEnum.WORKSPACE} is ${EventTypeEnum.DELETE}d called ${workspace.title}`,
      };

      await this.eventLogsService.create(eventLogsDto);

      return deleted;
    } catch (error) {
      throw new BadRequestException('Failed to delete workspace');
    }
  }

  async getById(id: string): Promise<WorkspaceEntity> {
    const workspace = await this.workspaceRepository.findOne({
      where: {
        id,
        status: ActiveStatusEnum.ACTIVE,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }
}
