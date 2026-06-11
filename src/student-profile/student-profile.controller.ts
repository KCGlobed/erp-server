import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { StudentProfileService } from './student-profile.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user.type';

@ApiTags('Student Profile')
@ApiBearerAuth()
@Controller({ path: 'student-profile', version: '1' })
export class StudentProfileController {
  constructor(private readonly service: StudentProfileService) {}

  // ── Student: own profile ──────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get own student profile' })
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.service.getMyProfile(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own student profile' })
  updateMyProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.service.updateMyProfile(user, dto);
  }

  // ── Admin: manage any student's profile ──────────────────────

  @Get(':studentId')
  @ApiOperation({ summary: 'Admin: Get a student profile by ID' })
  @ApiParam({ name: 'studentId', description: 'Student user ID' })
  getStudentProfile(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getStudentProfile(user, studentId);
  }

  @Patch(':studentId')
  @ApiOperation({ summary: 'Admin: Update a student profile by ID' })
  @ApiParam({ name: 'studentId', description: 'Student user ID' })
  updateStudentProfile(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.service.updateStudentProfile(user, studentId, dto);
  }
}
