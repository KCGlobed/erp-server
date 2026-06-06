import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GcsService } from './gcs.service';
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
      throw new ForbiddenException('Only faculty members can access this resource');
    }
  }

  async getProfile(currentUser: AuthUser) {
    this.assertFaculty(currentUser);
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { facultyProfile: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      profile: user.facultyProfile,
    };
  }

  async updateProfile(currentUser: AuthUser, dto: UpdateFacultyProfileDto) {
    this.assertFaculty(currentUser);

    const profile = await this.prisma.facultyProfile.upsert({
      where: { userId: currentUser.id },
      create: { userId: currentUser.id, ...dto },
      update: { ...dto },
    });

    return profile;
  }

  async uploadPhoto(currentUser: AuthUser, buffer: Buffer, mimetype: string) {
    this.assertFaculty(currentUser);

    const url = await this.gcs.uploadProfilePhoto(currentUser.id, buffer, mimetype);

    // Save URL to profile
    await this.prisma.facultyProfile.upsert({
      where: { userId: currentUser.id },
      create: { userId: currentUser.id, profilePhotoUrl: url },
      update: { profilePhotoUrl: url },
    });

    return { profilePhotoUrl: url };
  }
}
