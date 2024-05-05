import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { UserPayload } from 'src/common/decorators/user-payload.decorator';
import { GetTArgetDto } from './dto/get-target.dto';
import { TargetDto } from './dto/target.dto';
import { UpdateTargetDto } from './dto/update-target.dto';
import { TargetService } from './target.service';

@ApiTags('Target')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'target',
  version: '1',
})
export class TargetController {
  constructor(private readonly targetService: TargetService) {}

  @Post()
  async create(
    @Body() dto: TargetDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.targetService.create(dto, jwtPayload);

      return { message: 'Target set successfully!', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }
}
