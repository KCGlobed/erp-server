import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FacultyProfileService } from './faculty-profile.service';
import { UpdateFacultyProfileDto } from './dto/update-faculty-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user.type';

@ApiTags('Faculty Profile')
@ApiBearerAuth()
@Controller({ path: 'faculty-profile', version: '1' })
export class FacultyProfileController {
  constructor(private readonly service: FacultyProfileService) {}

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

  @Post('me/photo')
  @ApiOperation({ summary: 'Upload profile photo to Google Cloud Storage' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }
    return this.service.uploadPhoto(user, file.buffer, file.mimetype);
  }
}
