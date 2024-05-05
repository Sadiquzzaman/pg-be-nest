import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { UserPayload } from 'src/common/decorators/user-payload.decorator';
import { OwnerEnum } from 'src/common/enums/owner.enum';
import { TrackerDto } from './dto/tracker.dto';
import { UpdateTrackerDto } from './dto/update-tracker.dto';
import { TrackerMembersService } from './tracker-members.service';
import { TrackerService } from './tracker.service';
import { TrackerMembersDto } from './dto/tracker-members.dto';

@ApiTags('Tracker')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'tracker',
  version: '1',
})
export class TrackerController {
  constructor(
    private readonly trackerService: TrackerService,
    private readonly trackerMembersService: TrackerMembersService,
  ) {}

  @Post()
  async create(
    @Body() dto: TrackerDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.trackerService.create(dto, jwtPayload);

      const userIDs = dto.user_ids || [];

      if (!userIDs.includes(jwtPayload.id)) {
        userIDs.push(jwtPayload.id);
      }

      const trackerMembersDto = {
        tracker_id: payload.id,
        user_ids: userIDs,
      };

      await this.trackerMembersService.create(trackerMembersDto, jwtPayload);

      return { message: 'Tracker created successfully!', payload };
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @Get()
  @ApiQuery({ name: 'isArchived', required: false })
  async getAllByTracker(
    @Query('workspaceId') workspaceId: string,
    @Query('isArchived') isArchived: boolean,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.trackerService.getAllByWorkspaceId(
        workspaceId,
        jwtPayload,
        isArchived ?? false,
      );
      return { message: 'All Tracker List!', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  @Patch(':id')
  @ApiParam({ name: 'id' })
  async update(
    @Param('id') id: string,
    @Body() trackerDto: UpdateTrackerDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.trackerService.update(
        id,
        trackerDto,
        jwtPayload,
      );

      return { message: 'Tracker updated successfully!', payload };
    } catch (error) {
      throw new BadRequestException('Tracker updated failed!');
    }
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  async findById(
    @Param('id') id: string,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const tracker = await this.trackerService.findById(id, jwtPayload);
      if (!tracker) {
        throw new NotFoundException('Tracker not found');
      }
      return { payload: tracker };
    } catch {
      throw new NotFoundException('Tracker not found');
    }
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    await this.trackerService.remove(id, jwtPayload);
    return { message: 'Tracker deleted successfully!' };
  }
}
