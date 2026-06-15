import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GcsService } from '../storage/gcs.service';
import { UpdateFacultyProfileDto } from './dto/update-faculty-profile.dto';
import { AuthUser } from '../common/types/auth-user.type';

@Injectable()
export class FacultyProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gcs: GcsService,
  ) {}

  private assertFaculty(user: AuthUser) {
    if (!user.roles.includes('FACULTY')) {
      throw new ForbiddenException(
        'Only faculty members can access this resource',
      );
    }
  }

  async getProfile(currentUser: AuthUser) {
    this.assertFaculty(currentUser);
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        facultyProfile: true,
        experiences: { orderBy: { fromDate: 'desc' } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Generate short-lived signed URLs for GCS images
    const profilePhotoUrl = user.facultyProfile?.profilePhotoUrl 
      ? await this.gcs.getSignedUrl(user.facultyProfile.profilePhotoUrl) 
      : null;
      
    const profileBannerUrl = user.facultyProfile?.profileBannerUrl
      ? await this.gcs.getSignedUrl(user.facultyProfile.profileBannerUrl)
      : null;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      profilePhotoUrl,
      profileBannerUrl,
      profile: user.facultyProfile,
      experiences: user.experiences,
    };
  }

  async updateProfile(currentUser: AuthUser, dto: UpdateFacultyProfileDto) {
    this.assertFaculty(currentUser);

    const { experiences, ...profileData } = dto;

    // Guard: cannot add experiences if fresher
    if (experiences && experiences.length > 0 && profileData.isFresher) {
      throw new BadRequestException(
        'Cannot add experiences when isFresher is set to true.',
      );
    }

    const profile = await this.prisma.facultyProfile.upsert({
      where: { userId: currentUser.id },
      create: { userId: currentUser.id, ...profileData },
      update: { ...profileData },
    });

    // Replace experiences if the key was sent in the payload
    if (experiences !== undefined) {
      await this.prisma.$transaction([
        this.prisma.experience.deleteMany({ where: { userId: currentUser.id } }),
        ...experiences.map((exp) =>
          this.prisma.experience.create({
            data: {
              ...exp,
              fromDate: new Date(exp.fromDate),
              toDate: exp.toDate ? new Date(exp.toDate) : undefined,
              userId: currentUser.id,
            },
          }),
        ),
      ]);
    }

    return profile;
  }

  async uploadImages(
    currentUser: AuthUser,
    photoData?: { buffer: Buffer; mimetype: string },
    bannerData?: { buffer: Buffer; mimetype: string },
  ) {
    this.assertFaculty(currentUser);
    const updateData: any = {};

    if (photoData) {
      const url = await this.gcs.uploadProfileImage(
        currentUser.id,
        photoData.buffer,
        photoData.mimetype,
        'photo',
      );
      updateData.profilePhotoUrl = url;
    }

    if (bannerData) {
      const url = await this.gcs.uploadProfileImage(
        currentUser.id,
        bannerData.buffer,
        bannerData.mimetype,
        'banner',
      );
      updateData.profileBannerUrl = url;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.facultyProfile.upsert({
        where: { userId: currentUser.id },
        create: { userId: currentUser.id, ...updateData },
        update: { ...updateData },
      });
    }

    return this.getProfile(currentUser);
  }
}
