import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';

@ApiTags('Courses')
@ApiBearerAuth()
@Controller({ path: 'courses', version: '1' })
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({ summary: 'Create a course (Admin)' })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all courses' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details by ID' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({ summary: 'Update a course (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({ summary: 'Delete a course (Admin)' })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  // --- Curriculum Endpoints ---

  @Post(':id/curriculums')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({ summary: 'Create a curriculum version for a course' })
  createCurriculum(@Param('id') id: string, @Body() dto: CreateCurriculumDto) {
    return this.coursesService.createCurriculum(id, dto);
  }

  @Get(':id/curriculums')
  @ApiOperation({ summary: 'Get all curriculum versions for a course' })
  findCurriculums(@Param('id') id: string) {
    return this.coursesService.findCurriculums(id);
  }

  // --- Subject Endpoints ---

  @Post('curriculums/:curriculumId/subjects')
  @RequirePermissions(PERMISSION_NAMES.MANAGE_ACADEMICS)
  @ApiOperation({ summary: 'Create a subject under a curriculum version' })
  createSubject(@Param('curriculumId') curriculumId: string, @Body() dto: CreateSubjectDto) {
    return this.coursesService.createSubject(curriculumId, dto);
  }

  @Get('curriculums/:curriculumId/subjects')
  @ApiOperation({ summary: 'List all subjects under a curriculum version' })
  findSubjects(@Param('curriculumId') curriculumId: string) {
    return this.coursesService.findSubjects(curriculumId);
  }
}
