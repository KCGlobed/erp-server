import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  BadRequestException,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import '@fastify/multipart';
import { FacultyProfileService } from './faculty-profile.service';
import { UpdateFacultyProfileDto } from './dto/update-faculty-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user.type';
import { GcsService } from '../storage/gcs.service';

@ApiTags('Faculty Profile')
@ApiBearerAuth()
@Controller({ path: 'faculty-profile', version: '1' })
export class FacultyProfileController {
  constructor(
    private readonly service: FacultyProfileService,
    private readonly gcs: GcsService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own faculty profile' })
  getProfile(@CurrentUser() user: AuthUser) {
    return this.service.getProfile(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own faculty profile' })
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateFacultyProfileDto,
  ) {
    return this.service.updateProfile(user, dto);
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




}
