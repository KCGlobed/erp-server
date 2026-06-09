import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { SyncPermissionsDto } from './dto/sync-permissions.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';

@ApiTags('Roles')
@ApiBearerAuth()
@RequirePermissions(PERMISSION_NAMES.MANAGE_ROLES)
@Controller({ path: 'roles', version: '1' })
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a role' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all roles with permissions and user count' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single role with its permissions' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role name/description' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role (cascades UserRole)' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Sync (replace) all permissions for a role' })
  syncPermissions(@Param('id') id: string, @Body() dto: SyncPermissionsDto) {
    return this.rolesService.syncPermissions(id, dto.permissionIds);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Assign a single permission to a role' })
  assignPermission(@Param('id') id: string, @Body() dto: AssignPermissionDto) {
    return this.rolesService.assignPermission(id, dto.permissionId);
  }

  @Delete(':id/permissions/:permId')
  @ApiOperation({ summary: 'Remove a single permission from a role' })
  removePermission(@Param('id') id: string, @Param('permId') permId: string) {
    return this.rolesService.removePermission(id, permId);
  }
}
