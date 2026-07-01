import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user.type';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @Post()
  @ApiOperation({ summary: 'Create a new notification (Admin)' })
  create(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notificationsService.create(createNotificationDto, user);
  }

  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @Get()
  @ApiOperation({ summary: 'Get all notifications (Admin)' })
  findAll() {
    return this.notificationsService.findAllForAdmin();
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my notifications (Any authenticated user)' })
  findMyNotifications(@CurrentUser() user: AuthUser) {
    return this.notificationsService.findMyNotifications(user);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read (Any authenticated user)' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notificationsService.markAsRead(id, user);
  }

  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification (Admin)' })
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification (Admin)' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
