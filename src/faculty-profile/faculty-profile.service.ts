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

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      profilePhotoUrl: user.facultyProfile?.profilePhotoUrl,
      profileBannerUrl: user.facultyProfile?.profileBannerUrl,
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

  async uploadPhoto(currentUser: AuthUser, buffer: Buffer, mimetype: string) {
    this.assertFaculty(currentUser);

    const url = await this.gcs.uploadProfilePhoto(
      currentUser.id,
      buffer,
      mimetype,
    );

    // Save URL to profile
    await this.prisma.facultyProfile.upsert({
      where: { userId: currentUser.id },
      create: { userId: currentUser.id, profilePhotoUrl: url },
      update: { profilePhotoUrl: url },
    });

    return { profilePhotoUrl: url };
  }
}
