import { Body, Controller, Get, Param, Patch, Query, BadRequestException } from '@nestjs/common';
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
import { GcsService } from '../storage/gcs.service';

@ApiTags('Student Profile')
@ApiBearerAuth()
@Controller({ path: 'student-profile', version: '1' })
export class StudentProfileController {
  constructor(
    private readonly service: StudentProfileService,
    private readonly gcs: GcsService,
  ) {}

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

  @Get('me/upload-url')
  @ApiOperation({ summary: 'Get a signed URL to upload a profile photo or banner directly to GCS' })
  async getUploadUrl(
    @CurrentUser() user: AuthUser,
    @Query('fileType') fileType: 'PHOTO' | 'BANNER',
    @Query('contentType') contentType: string,
  ) {
    if (!['PHOTO', 'BANNER'].includes(fileType)) {
      throw new BadRequestException('fileType must be PHOTO or BANNER');
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException('contentType must be image/jpeg, image/png, or image/webp');
    }

    const ext = contentType.split('/')[1];
    const prefix = fileType === 'PHOTO' ? 'photo' : 'banner';
    const filename = `student-profiles/${user.id}-${prefix}-${Date.now()}.${ext}`;

    return this.gcs.generateUploadSignedUrl(filename, contentType);
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
