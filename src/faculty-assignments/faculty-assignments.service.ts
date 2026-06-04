import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignCourseDto } from './dto/assign-course.dto';
import { AuthUser } from '../common/types/auth-user.type';

@Injectable()
export class FacultyAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(user: AuthUser) {
    return (
      user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN')
    );
  }

  // ─── Admin: Assign a course to a faculty ─────────────────────────────────

  async assignCourse(dto: AssignCourseDto, currentUser: AuthUser) {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can assign courses to faculty');
    }

    const faculty = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { roles: { include: { role: true } } },
    });
    if (!faculty) throw new NotFoundException('Faculty user not found');

    const hasFacultyRole = faculty.roles.some((r) => r.role.name === 'FACULTY');
    if (!hasFacultyRole) {
      throw new ForbiddenException('User does not have the FACULTY role');
    }

    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.facultyCourseAssignment.findUnique({
      where: { userId_courseId: { userId: dto.userId, courseId: dto.courseId } },
    });
    if (existing) {
      throw new ConflictException('This course is already assigned to the faculty member');
    }

    await this.prisma.facultyCourseAssignment.create({
      data: { userId: dto.userId, courseId: dto.courseId },
    });

    return { message: `Course "${course.name}" assigned to faculty successfully` };
  }

  // ─── Admin: Unassign a course from a faculty ──────────────────────────────

  async unassignCourse(dto: AssignCourseDto, currentUser: AuthUser) {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can unassign courses from faculty');
    }

    const existing = await this.prisma.facultyCourseAssignment.findUnique({
      where: { userId_courseId: { userId: dto.userId, courseId: dto.courseId } },
    });
    if (!existing) throw new NotFoundException('Assignment not found');

    await this.prisma.facultyCourseAssignment.delete({
      where: { userId_courseId: { userId: dto.userId, courseId: dto.courseId } },
    });

    return { message: 'Course unassigned from faculty successfully' };
  }

  // ─── Faculty: My assigned courses ────────────────────────────────────────

  async getMyCourses(currentUser: AuthUser) {
    const assignments = await this.prisma.facultyCourseAssignment.findMany({
      where: { userId: currentUser.id },
      include: {
        course: {
          include: {
            curriculums: {
              include: {
                subjects: true,
                _count: { select: { subjects: true } },
              },
            },
          },
        },
      },
    });
    return assignments.map((a) => a.course);
  }

  // ─── Faculty: My students (those enrolled in my assigned courses) ─────────

  async getMyStudents(currentUser: AuthUser) {
    const assignments = await this.prisma.facultyCourseAssignment.findMany({
      where: { userId: currentUser.id },
      select: { courseId: true },
    });

    const courseIds = assignments.map((a) => a.courseId);
    if (courseIds.length === 0) return [];

    return this.prisma.user.findMany({
      where: {
        roles: { some: { role: { name: 'STUDENT' } } },
        enrollments: { some: { courseId: { in: courseIds } } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        enrollments: {
          where: { courseId: { in: courseIds } },
          include: { course: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  // ─── Admin: Get courses of a specific faculty ─────────────────────────────

  async getFacultyCourses(facultyId: string, currentUser: AuthUser) {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can view faculty assignments');
    }

    const assignments = await this.prisma.facultyCourseAssignment.findMany({
      where: { userId: facultyId },
      include: {
        course: { select: { id: true, name: true, code: true, status: true } },
      },
    });
    return assignments.map((a) => a.course);
  }

  // ─── Admin: Get students of a specific faculty ────────────────────────────

  async getFacultyStudents(facultyId: string, currentUser: AuthUser) {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can view faculty students');
    }

    const assignments = await this.prisma.facultyCourseAssignment.findMany({
      where: { userId: facultyId },
      select: { courseId: true },
    });

    const courseIds = assignments.map((a) => a.courseId);
    if (courseIds.length === 0) return [];

    return this.prisma.user.findMany({
      where: {
        roles: { some: { role: { name: 'STUDENT' } } },
        enrollments: { some: { courseId: { in: courseIds } } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }
}
