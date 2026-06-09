import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user.type';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller({ path: 'attendance', version: '1' })
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('class/:classScheduleId')
  @ApiOperation({ summary: 'Get attendance for a specific class schedule' })
  getClassAttendance(@Param('classScheduleId') classScheduleId: string) {
    return this.attendanceService.getClassAttendance(classScheduleId);
  }

  @Post('class/:classScheduleId')
  @ApiOperation({ summary: 'Mark or update attendance for a class schedule' })
  markAttendance(
    @Param('classScheduleId') classScheduleId: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attendanceService.markAttendance(classScheduleId, dto, user);
  }
}
