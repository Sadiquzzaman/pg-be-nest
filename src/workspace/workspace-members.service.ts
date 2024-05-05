import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceService } from 'src/workspace/workspace.service';
import { UserService } from '../user/user.service';
import { WorkspaceMembersDto } from './dto/workspace-members.dto';
import { WorkspaceMembersEntity } from './entities/workspace.entity/workspace-members.entity';
import { WorkspaceMembersRepository } from './repositories/workspace-members.repository';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { WorkspaceMembersSearchDto } from './dto/workspace-members-search.dto';
import { In } from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity/user.entity';
import { OwnerEnum } from 'src/common/enums/owner.enum';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    private readonly workspaceMembersRepository: WorkspaceMembersRepository,
    private readonly userService: UserService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async create(
    dto: Partial<WorkspaceMembersDto>,
    jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const workspace = await this.workspaceService.getById(dto.workspace_id);

      const existingMembers = await this.workspaceMembersRepository.find({
        where: {
          workspace: {
            id: workspace.id,
          },
          user: {
            id: In(dto.user_ids),
          },
        },
        relations: ['workspace', 'user'],
      });

      const newUserIds = dto.user_ids.filter(
        (userId) =>
          !existingMembers.some(
            (member) =>
              member.user.id === userId &&
              member.workspace.id === dto.workspace_id,
          ),
      );

      if (newUserIds.length === 0) {
        throw new BadRequestException(
          'Your selected users are already assigned',
        );
      }

      const usersById = new Map<string, UserEntity>();
      const users = await this.userService.findByIds(newUserIds);

      users.forEach((user) => {
        usersById.set(user.id, user);
      });

      const workspaceMembersEntities = newUserIds.map((userId) => ({
        is_owner:
          userId === jwtPayload.id ? OwnerEnum.OWNER : OwnerEnum.NOT_OWNER,
        workspace: workspace,
        user: usersById.get(userId),
      }));

      await this.workspaceMembersRepository.save(workspaceMembersEntities);
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  async findMembersByWorkspaceId(
    id: string,
    dto: WorkspaceMembersSearchDto,
  ): Promise<WorkspaceMembersEntity[]> {
    const query = await this.workspaceMembersRepository
      .createQueryBuilder('workspaceMembers')
      .leftJoinAndSelect('workspaceMembers.user', 'user')
      .leftJoin('workspaceMembers.workspace', 'workspace')
      .where('workspace.id = :workspaceId', { workspaceId: id });

    if (dto.userName) {
      query.andWhere('lower(user.name) like :userName', {
        userName: `%${dto.userName.toLowerCase()}%`,
      });
    }

    if (
      dto.is_owner !== undefined &&
      (dto.is_owner === 0 || dto.is_owner === 1)
    ) {
      query.andWhere('workspaceMembers.is_owner = :isOwner', {
        isOwner: dto.is_owner,
      });
    }

    const workspaceMembers = await query.getMany();

    return workspaceMembers;
  }

  async deleteWorkspaceMembers(
    userIds: string[],
    workspaceId: string,
  ): Promise<number> {
    const workspaceMembers = await this.workspaceMembersRepository
      .createQueryBuilder('workspaceMembers')
      .leftJoinAndSelect('workspaceMembers.user', 'user')
      .leftJoinAndSelect('workspaceMembers.workspace', 'workspace')
      .where('workspace.id = :workspaceId', { workspaceId: workspaceId })
      .andWhere('user.id IN (:...userIds)', { userIds: userIds })
      .getMany();

    if (workspaceMembers.length === 0) {
      return 0;
    }

    const hasOwner = workspaceMembers.some(
      (member) => member.is_owner === OwnerEnum.OWNER,
    );

    if (hasOwner) {
      throw new BadRequestException("Owner can't be deleted.");
    }

    await this.workspaceMembersRepository.remove(workspaceMembers);

    return workspaceMembers.length;
  }
}
