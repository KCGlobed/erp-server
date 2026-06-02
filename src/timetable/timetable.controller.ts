import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';
import type { AuthUser } from '../common/types/auth-user.type';

@ApiTags('Timetable')
@ApiBearerAuth()
@Controller({ path: 'timetable', version: '1' })
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post('schedule')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_TIMETABLES)
  @ApiOperation({ summary: 'Schedule a class session (Admin)' })
  createSchedule(@Body() dto: CreateScheduleDto) {
    return this.timetableService.createSchedule(dto);
  }

  @Get('schedule')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_TIMETABLES)
  @ApiOperation({ summary: 'List all scheduled class sessions (Admin)' })
  findAllSchedules() {
    return this.timetableService.findAllSchedules();
  }

  @Get('personalized')
  @ApiOperation({ summary: 'Get consolidated personalized calendar matching the user context' })
  getPersonalizedCalendar(@CurrentUser() user: AuthUser) {
    return this.timetableService.getPersonalizedCalendar(user);
  }
}
