import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { EventLogsService } from './event-logs.service';

@ApiTags('Event Logs')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'event-logs',
  version: '1',
})
export class EventLogsController {
  constructor(private readonly eventLogsService: EventLogsService) {}

  @Get('/:trackerId')
  async getAll(@Param('trackerId') trackerId: string) {
    try {
      const payload = await this.eventLogsService.getAllByTrackerId(trackerId);
      return { message: 'All activity List!', payload };
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
