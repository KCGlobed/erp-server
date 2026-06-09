import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';

@ApiTags('Permissions')
@ApiBearerAuth()
@RequirePermissions(PERMISSION_NAMES.MANAGE_ROLES)
@Controller({ path: 'permissions', version: '1' })
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a permission' })
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all permissions with role and user counts' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a permission' })
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a permission (not allowed for system permissions)',
  })
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
