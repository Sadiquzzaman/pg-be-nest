import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { TrackerMembersSearchDto } from './dto/tracker-members-search.dto';
import { TrackerMembersDto } from './dto/tracker-members.dto';
import { TrackerMembersService } from './tracker-members.service';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { UserPayload } from 'src/common/decorators/user-payload.decorator';

@ApiTags('Tracker_Members')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'tracker-members',
  version: '1',
})
export class TrackerMemberController {
  constructor(private readonly trackerMembersService: TrackerMembersService) {}

  @Post()
  async assignTrackerMember(
    @Body() trackerDto: TrackerMembersDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.trackerMembersService.create(
        trackerDto,
        jwtPayload,
      );
      return { message: 'Member Assigned to tracker successfully!', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  @Get(':trackerId')
  async findMembersByTrackerId(
    @Param('trackerId') trackerId: string,
    @Query() dto: TrackerMembersSearchDto,
  ) {
    try {
      const trackerMembers =
        await this.trackerMembersService.findMembersByTrackerId(trackerId, dto);
      if (!trackerMembers) {
        throw new NotFoundException('Members not found');
      }
      return { payload: trackerMembers };
    } catch {
      throw new NotFoundException('Members not found');
    }
  }

  @Delete(':trackerId')
  async deleteTrackerMember(
    @Param('trackerId') trackerId: string,
    @Body() userIds: string[],
  ) {
    try {
      await this.trackerMembersService.deleteTrackerMember(userIds, trackerId);

      return {
        message: 'Removed Member from tracker successfully!',
        payload: true,
      };
    } catch (error) {
      throw new NotFoundException(error.response.message);
    }
  }
}
