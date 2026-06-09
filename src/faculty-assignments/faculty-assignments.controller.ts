import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FacultyAssignmentsService } from './faculty-assignments.service';
import { AssignCourseDto } from './dto/assign-course.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user.type';

@ApiTags('Faculty Assignments')
@ApiBearerAuth()
@Controller({ path: 'faculty-assignments', version: '1' })
export class FacultyAssignmentsController {
  constructor(private readonly service: FacultyAssignmentsService) {}

  // ── Admin endpoints ────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Assign a course to a faculty user (Admin)' })
  assignCourse(@Body() dto: AssignCourseDto, @CurrentUser() user: AuthUser) {
    return this.service.assignCourse(dto, user);
  }

  @Delete()
  @ApiOperation({ summary: 'Unassign a course from a faculty user (Admin)' })
  unassignCourse(@Body() dto: AssignCourseDto, @CurrentUser() user: AuthUser) {
    return this.service.unassignCourse(dto, user);
  }

  @Get(':facultyId/courses')
  @ApiOperation({
    summary: 'Get all courses assigned to a faculty user (Admin)',
  })
  getFacultyCourses(
    @Param('facultyId') facultyId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getFacultyCourses(facultyId, user);
  }

  @Get(':facultyId/students')
  @ApiOperation({ summary: 'Get students visible to a faculty user (Admin)' })
  getFacultyStudents(
    @Param('facultyId') facultyId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getFacultyStudents(facultyId, user);
  }

  // ── Faculty (self) endpoints ──────────────────────────────────────────

  @Get('my-courses')
  @ApiOperation({ summary: 'Get courses assigned to the logged-in faculty' })
  getMyCourses(@CurrentUser() user: AuthUser) {
    return this.service.getMyCourses(user);
  }

  @Get('my-students')
  @ApiOperation({ summary: 'Get students visible to the logged-in faculty' })
  getMyStudents(@CurrentUser() user: AuthUser) {
    return this.service.getMyStudents(user);
  }
}
