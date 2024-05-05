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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { UserPayload } from 'src/common/decorators/user-payload.decorator';
import { OwnerEnum } from 'src/common/enums/owner.enum';
import { WorkspaceDto } from './dto/workspace.dto';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceService } from './workspace.service';
import { WorkspaceMembersDto } from './dto/workspace-members.dto';

@ApiTags('Workspace')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'workspace',
  version: '1',
})
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  @Post()
  async create(
    @Body() workspaceDto: WorkspaceDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.workspaceService.create(
        workspaceDto,
        jwtPayload,
      );

      const workspaceMembersDto = {
        is_owner: OwnerEnum.OWNER,
        workspace_id: payload.id,
        user_ids: [jwtPayload.id],
      };

      await this.workspaceMembersService.create(
        workspaceMembersDto,
        jwtPayload,
      );

      return { message: 'Workspace created successfully!', payload };
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @Get()
  async getAll(@UserPayload() jwtPayload: JwtPayloadInterface) {
    try {
      const payload = await this.workspaceService.getAll(jwtPayload);
      return { message: 'All Workspaces List!', payload };
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @Patch(':id')
  @ApiParam({ name: 'id' })
  async update(
    @Param('id') id: string,
    @Body() workspaceDto: WorkspaceDto,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const payload = await this.workspaceService.update(
        id,
        workspaceDto,
        jwtPayload,
      );

      return { message: 'Workspace updated successfully!', payload };
    } catch (error) {
      throw new BadRequestException('Workspace updated failed!');
    }
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  async findById(
    @Param('id') id: string,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    try {
      const workspace = await this.workspaceService.findById(id, jwtPayload);
      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }
      return { payload: workspace };
    } catch {
      throw new NotFoundException('Workspace not found');
    }
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @UserPayload() jwtPayload: JwtPayloadInterface,
  ) {
    await this.workspaceService.remove(id, jwtPayload);
    return { message: 'Workspace deleted successfully!' };
  }
}
