import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { AuthUser } from '../common/types/auth-user.type';

@Injectable()
export class StudentProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private assertStudent(user: AuthUser) {
    if (!user.roles.includes('STUDENT')) {
      throw new ForbiddenException(
        'Only students can access this resource',
      );
    }
  }

  private assertAdmin(user: AuthUser) {
    if (
      !user.roles.includes('ADMIN') &&
      !user.roles.includes('SUPER_ADMIN')
    ) {
      throw new ForbiddenException(
        'Only administrators can update student profiles',
      );
    }
  }

  async getMyProfile(currentUser: AuthUser) {
    this.assertStudent(currentUser);

    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        studentProfile: true,
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
      profilePhotoUrl: user.studentProfile?.profilePhotoUrl,
      profileBannerUrl: user.studentProfile?.profileBannerUrl,
      profile: user.studentProfile,
      experiences: user.experiences,
    };
  }

  async updateMyProfile(
    currentUser: AuthUser,
    dto: UpdateStudentProfileDto,
  ) {
    this.assertStudent(currentUser);

    const { experiences, ...profileData } = dto;

    // Guard: cannot add experiences if fresher
    if (experiences && experiences.length > 0 && profileData.isFresher) {
      throw new BadRequestException(
        'Cannot add experiences when isFresher is set to true.',
      );
    }

    const profile = await this.prisma.studentProfile.upsert({
      where: { userId: currentUser.id },
      create: { userId: currentUser.id, ...profileData },
      update: { ...profileData },
    });

    // Replace experiences if the key was sent
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

  /** Admin: get any student's profile */
  async getStudentProfile(currentUser: AuthUser, studentId: string) {
    this.assertAdmin(currentUser);

    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true,
        experiences: { orderBy: { fromDate: 'desc' } },
      },
    });

    if (!user) throw new NotFoundException('Student not found');

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      profilePhotoUrl: user.studentProfile?.profilePhotoUrl,
      profileBannerUrl: user.studentProfile?.profileBannerUrl,
      profile: user.studentProfile,
      experiences: user.experiences,
    };
  }

  /** Admin: update any student's profile */
  async updateStudentProfile(
    currentUser: AuthUser,
    studentId: string,
    dto: UpdateStudentProfileDto,
  ) {
    this.assertAdmin(currentUser);

    const user = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!user) throw new NotFoundException('Student not found');

    const { experiences, ...profileData } = dto;

    if (experiences && experiences.length > 0 && profileData.isFresher) {
      throw new BadRequestException(
        'Cannot add experiences when isFresher is set to true.',
      );
    }

    const profile = await this.prisma.studentProfile.upsert({
      where: { userId: studentId },
      create: { userId: studentId, ...profileData },
      update: { ...profileData },
    });

    if (experiences !== undefined) {
      await this.prisma.$transaction([
        this.prisma.experience.deleteMany({ where: { userId: studentId } }),
        ...experiences.map((exp) =>
          this.prisma.experience.create({
            data: {
              ...exp,
              fromDate: new Date(exp.fromDate),
              toDate: exp.toDate ? new Date(exp.toDate) : undefined,
              userId: studentId,
            },
          }),
        ),
      ]);
    }

    return profile;
  }
}
