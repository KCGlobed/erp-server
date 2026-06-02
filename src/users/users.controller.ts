import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';
import type { AuthUser } from '../common/types/auth-user.type';

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (paginated, with visibility constraints)' })
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user: AuthUser) {
    return this.usersService.findAll(query.page ?? 1, query.limit ?? 20, user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Current user profile and permissions' })
  findMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findMe(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (self or admin)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.findById(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile (self or admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Post(':id/roles')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_USERS)
  @ApiOperation({ summary: 'Assign role to user' })
  assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.usersService.assignRole(id, dto.roleId);
  }

  @Delete(':id/roles/:roleId')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_USERS)
  @ApiOperation({ summary: 'Remove role from user' })
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.usersService.removeRole(id, roleId);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_USERS)
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.remove(id, user);
  }

  // --- Direct User Permissions ---

  @Get(':id/permissions')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ROLES)
  @ApiOperation({ summary: 'Get direct permissions granted to a user' })
  getUserDirectPermissions(@Param('id') id: string) {
    return this.usersService.getUserDirectPermissions(id);
  }

  @Post(':id/permissions')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ROLES)
  @ApiOperation({ summary: 'Grant a direct permission to a user' })
  grantUserPermission(
    @Param('id') id: string,
    @Body() dto: { permissionId: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.grantUserPermission(id, dto.permissionId, user.id);
  }

  @Delete(':id/permissions/:permId')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ROLES)
  @ApiOperation({ summary: 'Revoke a direct permission from a user' })
  revokeUserPermission(
    @Param('id') id: string,
    @Param('permId') permId: string,
  ) {
    return this.usersService.revokeUserPermission(id, permId);
  }
}
