import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { TrackerMembersSearchDto } from './dto/tracker-members-search.dto';
import { TrackerMembersDto } from './dto/tracker-members.dto';
import { TrackerMembersEntity } from './entities/tracker.entity/tracker-members.entity';
import { TrackerMembersRepository } from './repositories/tracker-members.repository';
import { TrackerService } from './tracker.service';
import { In } from 'typeorm';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { OwnerEnum } from 'src/common/enums/owner.enum';
import { UserEntity } from 'src/user/entities/user.entity/user.entity';

@Injectable()
export class TrackerMembersService {
  constructor(
    private readonly trackerMembersRepository: TrackerMembersRepository,
    private readonly trackerService: TrackerService,
    private readonly userService: UserService,
  ) {}

  async create(
    dto: Partial<TrackerMembersDto>,
    jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const tracker = await this.trackerService.getById(dto.tracker_id);

      const existingMembers = await this.trackerMembersRepository.find({
        where: {
          tracker: {
            id: tracker.id,
          },
          user: {
            id: In(dto.user_ids),
          },
        },
        relations: ['tracker', 'user'],
      });

      const newUserIds = dto.user_ids.filter(
        (userId) =>
          !existingMembers.some(
            (member) =>
              member.user.id === userId && member.tracker.id === dto.tracker_id,
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

      const trackerMemberEntities = newUserIds.map((userId) => ({
        is_owner:
          userId === jwtPayload.id ? OwnerEnum.OWNER : OwnerEnum.NOT_OWNER,
        tracker: tracker,
        user: usersById.get(userId),
      }));

      await this.trackerMembersRepository.save(trackerMemberEntities);
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  async findMembersByTrackerId(
    id: string,
    dto: TrackerMembersSearchDto,
  ): Promise<TrackerMembersEntity[]> {
    const query = await this.trackerMembersRepository
      .createQueryBuilder('trackerMembers')
      .leftJoinAndSelect('trackerMembers.user', 'user')
      .leftJoin('trackerMembers.tracker', 'tracker')
      .where('tracker.id = :trackerId', { trackerId: id });

    if (dto.userName) {
      query.andWhere('lower(user.name) like :userName', {
        userName: `%${dto.userName.toLowerCase()}%`,
      });
    }

    if (
      dto.is_owner !== undefined &&
      (dto.is_owner === 0 || dto.is_owner === 1)
    ) {
      query.andWhere('trackerMembers.is_owner = :isOwner', {
        isOwner: dto.is_owner,
      });
    }

    const trackerMembers = await query.getMany();

    return trackerMembers;
  }

  async deleteTrackerMember(
    userIds: string[],
    trackerId: string,
  ): Promise<number> {
    const trackerMember = await this.trackerMembersRepository
      .createQueryBuilder('trackerMembers')
      .leftJoinAndSelect('trackerMembers.user', 'user')
      .leftJoinAndSelect('trackerMembers.tracker', 'tracker')
      .where('tracker.id = :trackerId', { trackerId })
      .andWhere('user.id IN (:...userIds)', { userIds })
      .getMany();

    if (trackerMember.length === 0) {
      return 0;
    }

    const hasOwner = trackerMember.some(
      (member) => member.is_owner === OwnerEnum.OWNER,
    );

    if (hasOwner) {
      throw new BadRequestException("Owner can't be deleted.");
    }

    await this.trackerMembersRepository.remove(trackerMember);

    return trackerMember.length;
  }
}
