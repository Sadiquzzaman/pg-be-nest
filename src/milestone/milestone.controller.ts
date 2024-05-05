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
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { MilestoneService } from './milestone.service';
import { UserPayload } from 'src/common/decorators/user-payload.decorator';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { MilestoneDto } from './dto/milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@ApiTags('Milestone')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'milestone',
  version: '1',
})
export class MilestoneController {
  constructor(private readonly milestoneService: MilestoneService) {}

  @Post()
  async create(
    @Body() dto: MilestoneDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.milestoneService.create(dto, jwtPayload);

      return { message: 'Milestone created successfully!', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  @Get()
  async getAllByTracker(
    @Query('trackerId') trackerId: string,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.milestoneService.getAllMilestoneByTrackerId(
        trackerId,
        jwtPayload,
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
    @Body() milestoneDto: UpdateMilestoneDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.milestoneService.update(
        id,
        milestoneDto,
        jwtPayload,
      );

      return { message: 'Milestone updated successfully!', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  async findById(@Param('id') id: string) {
    try {
      const milestone = await this.milestoneService.findById(id);
      if (!milestone) {
        throw new NotFoundException('Milestone not found');
      }
      return { payload: milestone };
    } catch {
      throw new NotFoundException('Milestone not found');
    }
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    await this.milestoneService.remove(id, jwtPayload);
    return { message: 'Milestone deleted successfully!' };
  }
}
