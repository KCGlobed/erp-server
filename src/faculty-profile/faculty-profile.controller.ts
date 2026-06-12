import {
  Body,
  Controller,
  Get,
  Patch,
  BadRequestException,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
    const filename = `faculty-profiles/${user.id}-${prefix}-${Date.now()}.${ext}`;

    return this.gcs.generateUploadSignedUrl(filename, contentType);
  }


}
