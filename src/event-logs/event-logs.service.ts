import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { EventLogsDto } from './dto/event-logs.dto';
import { EventLogsEntity } from './entities/event-logs.entity/event-logs.entity';
import { EventLogsRepository } from './repositories/event-logs.repository';
import { OrderByCondition } from 'typeorm';

@Injectable()
export class EventLogsService {
  constructor(
    private readonly eventLogsRepository: EventLogsRepository,
    private readonly userService: UserService,
  ) {}

  async create(dto: EventLogsDto): Promise<EventLogsEntity> {
    try {
      const user = await this.userService.findById(dto.created_by);

      const EventLogsEntity = {
        ...dto,
        created_by: user,
      };

      const eventLog = await this.eventLogsRepository.save(EventLogsEntity);
      return eventLog;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async getAllByTrackerId(trackerId: string): Promise<EventLogsEntity[]> {
    try {
      const query = this.eventLogsRepository.createQueryBuilder('events');
      query.leftJoinAndSelect('events.created_by', 'created_by');
      query.where('events.event_reference = :event_reference', {
        event_reference: trackerId,
      });

      query.orderBy('events.created_at', 'DESC');

      return await query.getMany();
    } catch {
      throw new BadRequestException();
    }
  }
}
