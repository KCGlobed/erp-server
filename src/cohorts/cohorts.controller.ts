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
import { CohortsService } from './cohorts.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { LinkCourseDto } from './dto/link-course.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';

@ApiTags('Cohorts')
@ApiBearerAuth()
@Controller({ path: 'cohorts', version: '1' })
export class CohortsController {
  constructor(private readonly cohortsService: CohortsService) {}

  @Post()
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({ summary: 'Create a Cohort (Admin)' })
  create(@Body() dto: CreateCohortDto) {
    return this.cohortsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all cohorts' })
  findAll() {
    return this.cohortsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a cohort' })
  findOne(@Param('id') id: string) {
    return this.cohortsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({ summary: 'Update cohort details (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateCohortDto) {
    return this.cohortsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({ summary: 'Delete a cohort (Admin)' })
  remove(@Param('id') id: string) {
    return this.cohortsService.remove(id);
  }

  @Post(':id/courses')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({ summary: 'Link course & curriculum to cohort (Admin)' })
  linkCourse(@Param('id') id: string, @Body() dto: LinkCourseDto) {
    return this.cohortsService.linkCourse(id, dto);
  }

  @Post(':id/students')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({
    summary:
      'Assign student(s) to a cohort and auto-enroll them in courses (Admin)',
  })
  assignStudents(
    @Param('id') id: string,
    @Body() dto: { studentIds: string[] },
  ) {
    return this.cohortsService.assignStudents(id, dto.studentIds);
  }

  @Post(':id/faculty')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({ summary: 'Assign faculty user(s) to a cohort (Admin)' })
  assignFaculty(
    @Param('id') id: string,
    @Body() dto: { facultyIds: string[] },
  ) {
    return this.cohortsService.assignFaculty(id, dto.facultyIds);
  }

  @Post('students/:userId/courses')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({
    summary: 'Enroll a student directly into multiple courses (Admin)',
  })
  enrollStudentCourses(
    @Param('userId') userId: string,
    @Body() dto: { courseIds: string[] },
  ) {
    return this.cohortsService.enrollStudentCourses(userId, dto.courseIds);
  }

  @Post('faculty/:userId/courses')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({
    summary: 'Assign a faculty directly to multiple courses (Admin)',
  })
  assignFacultyCourses(
    @Param('userId') userId: string,
    @Body() dto: { courseIds: string[] },
  ) {
    return this.cohortsService.assignFacultyCourses(userId, dto.courseIds);
  }
}
