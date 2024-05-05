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
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { WorkspaceMembersDto } from './dto/workspace-members.dto';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceService } from './workspace.service';
import { WorkspaceMembersSearchDto } from './dto/workspace-members-search.dto';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';
import { UserPayload } from 'src/common/decorators/user-payload.decorator';

@ApiTags('Workspace_members')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'workspace-members',
  version: '1',
})
export class WorkspaceMembersController {
  constructor(
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  @Post()
  async assignWorkspaceMember(
    @UserPayload() jwtPayload: JwtPayloadInterface,
    @Body() workspaceDto: WorkspaceMembersDto,
  ) {
    try {
      const payload = await this.workspaceMembersService.create(
        workspaceDto,
        jwtPayload,
      );

      return { message: 'Member Assigned to workspace successfully!', payload };
    } catch (error) {
      throw new BadRequestException(error.response.message);
    }
  }

  @Get(':workspaceId')
  async findMembersByWorkspaceId(
    @Param('workspaceId') workspaceId: string,
    @Query() dto: WorkspaceMembersSearchDto,
  ) {
    try {
      const workspaceMembers =
        await this.workspaceMembersService.findMembersByWorkspaceId(
          workspaceId,
          dto,
        );
      if (!workspaceMembers) {
        throw new NotFoundException('Members not found');
      }
      return { payload: workspaceMembers };
    } catch {
      throw new NotFoundException('Members not found');
    }
  }

  @Delete(':workspaceId')
  async deleteWorkspaceMembers(
    @Param('workspaceId') workspaceId: string,
    @Body() userIds: string[],
  ) {
    try {
      await this.workspaceMembersService.deleteWorkspaceMembers(
        userIds,
        workspaceId,
      );

      return {
        message: 'Removed Members from workspace successfully!',
        payload: true,
      };
    } catch (error) {
      throw new NotFoundException(error.response.message);
    }
  }
}
