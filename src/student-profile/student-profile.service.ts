import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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
      include: { studentProfile: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      profile: user.studentProfile,
    };
  }

  async updateMyProfile(
    currentUser: AuthUser,
    dto: UpdateStudentProfileDto,
  ) {
    this.assertStudent(currentUser);

    const profile = await this.prisma.studentProfile.upsert({
      where: { userId: currentUser.id },
      create: { userId: currentUser.id, ...dto },
      update: { ...dto },
    });

    return profile;
  }

  /** Admin: get any student's profile */
  async getStudentProfile(currentUser: AuthUser, studentId: string) {
    this.assertAdmin(currentUser);

    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { studentProfile: true },
    });

    if (!user) throw new NotFoundException('Student not found');

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      profile: user.studentProfile,
    };
  }

  /** Admin: update any student's profile */
  async updateStudentProfile(
    currentUser: AuthUser,
    studentId: string,
    dto: UpdateStudentProfileDto,
  ) {
    this.assertAdmin(currentUser);

    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!user) throw new NotFoundException('Student not found');

    const profile = await this.prisma.studentProfile.upsert({
      where: { userId: studentId },
      create: { userId: studentId, ...dto },
      update: { ...dto },
    });

    return profile;
  }
}
