import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { CreateAcademicEventDto } from './dto/create-event.dto';
import { CreateExamScheduleDto } from './dto/create-exam.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';
import type { AuthUser } from '../common/types/auth-user.type';

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller({ path: 'calendar', version: '1' })
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // --- Academic Sessions ---

  @Post('sessions')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_CALENDAR)
  @ApiOperation({ summary: 'Create an Academic Session (Admin)' })
  createSession(@Body() dto: CreateSessionDto) {
    return this.calendarService.createSession(dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List all academic sessions' })
  findAllSessions() {
    return this.calendarService.findAllSessions();
  }

  // --- Holidays ---

  @Post('holidays')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_CALENDAR)
  @ApiOperation({ summary: 'Create a Holiday (Admin)' })
  createHoliday(@Body() dto: CreateHolidayDto) {
    return this.calendarService.createHoliday(dto);
  }

  @Get('holidays')
  @ApiOperation({
    summary: 'List holidays (filtered by visibility for student/faculty)',
  })
  findHolidays(@CurrentUser() user: AuthUser) {
    return this.calendarService.findHolidays(user);
  }

  // --- Academic Events ---

  @Post('events')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_CALENDAR)
  @ApiOperation({ summary: 'Create an Academic Event (Admin)' })
  createEvent(@Body() dto: CreateAcademicEventDto) {
    return this.calendarService.createEvent(dto);
  }

  @Get('events')
  @ApiOperation({
    summary: 'List events (filtered by visibility for student/faculty)',
  })
  findEvents(@CurrentUser() user: AuthUser) {
    return this.calendarService.findEvents(user);
  }

  // --- Exams ---

  @Post('exams')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_CALENDAR)
  @ApiOperation({ summary: 'Create an Exam Schedule (Admin)' })
  createExam(@Body() dto: CreateExamScheduleDto) {
    return this.calendarService.createExam(dto);
  }

  @Get('exams')
  @ApiOperation({ summary: 'List exams (filtered by relevance/invigilation)' })
  findExams(@CurrentUser() user: AuthUser) {
    return this.calendarService.findExams(user);
  }
}
