import { Body, Controller, Get, Post, Patch, Query, BadRequestException, Req, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { StudentProfileService } from './student-profile.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user.type';
import { GcsService } from '../storage/gcs.service';
import type { FastifyRequest } from 'fastify';
import '@fastify/multipart';

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

  @Post('me/images')
  @ApiOperation({ summary: 'Upload profile photo and/or banner directly via multipart form data' })
  @ApiConsumes('multipart/form-data')
  async uploadImages(
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    let photoData: { buffer: Buffer; mimetype: string } | undefined;
    let bannerData: { buffer: Buffer; mimetype: string } | undefined;

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(part.mimetype)) {
          throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
        }

        const buffer = await part.toBuffer();
        
        if (part.fieldname === 'photo') {
          photoData = { buffer, mimetype: part.mimetype };
        } else if (part.fieldname === 'banner') {
          bannerData = { buffer, mimetype: part.mimetype };
        }
      }
    }

    if (!photoData && !bannerData) {
      throw new BadRequestException('No photo or banner file provided in form data');
    }

    return this.service.uploadImages(user, photoData, bannerData);
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
