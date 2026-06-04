import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(currentUser: AuthUser) {
    const isAdmin =
      currentUser.roles.includes('SUPER_ADMIN') ||
      currentUser.roles.includes('ADMIN');
    const isFaculty = currentUser.roles.includes('FACULTY');
    const isStudent = currentUser.roles.includes('STUDENT');

    if (isAdmin) return this.getAdminStats();
    if (isFaculty) return this.getFacultyStats(currentUser.id);
    if (isStudent) return this.getStudentStats(currentUser.id);

    return { message: 'No dashboard data available for your role' };
  }

  // ─── Admin ───────────────────────────────────────────────────────────────

  private async getAdminStats() {
    const [
      totalStudents,
      totalFaculty,
      totalCourses,
      totalCohorts,
      activeCourses,
      recentEnrollments,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { roles: { some: { role: { name: 'STUDENT' } } } },
      }),
      this.prisma.user.count({
        where: { roles: { some: { role: { name: 'FACULTY' } } } },
      }),
      this.prisma.course.count(),
      this.prisma.cohort.count(),
      this.prisma.course.count({ where: { status: 'ACTIVE' } }),
      this.prisma.courseEnrollment.findMany({
        take: 8,
        orderBy: { enrolledAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          course: { select: { name: true, code: true } },
        },
      }),
    ]);

    return {
      role: 'ADMIN',
      stats: { totalStudents, totalFaculty, totalCourses, totalCohorts, activeCourses },
      recentEnrollments: recentEnrollments.map((e) => ({
        id: `${e.userId}-${e.courseId}`,
        studentName: `${e.user.firstName} ${e.user.lastName}`,
        studentEmail: e.user.email,
        courseName: e.course.name,
        courseCode: e.course.code,
        enrolledAt: e.enrolledAt,
      })),
    };
  }

  // ─── Faculty ─────────────────────────────────────────────────────────────

  private async getFacultyStats(facultyId: string) {
    const assignments = await this.prisma.facultyCourseAssignment.findMany({
      where: { userId: facultyId },
      include: {
        course: { select: { id: true, name: true, code: true, status: true } },
      },
    });

    const courseIds = assignments.map((a) => a.courseId);

    const [totalStudents, recentClasses] = await Promise.all([
      courseIds.length > 0
        ? this.prisma.user.count({
            where: {
              roles: { some: { role: { name: 'STUDENT' } } },
              enrollments: { some: { courseId: { in: courseIds } } },
            },
          })
        : 0,
      this.prisma.classSchedule.findMany({
        where: { facultyId },
        take: 5,
        include: {
          subject: { select: { name: true } },
          cohort: { select: { name: true } },
          course: { select: { name: true, code: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      }),
    ]);

    return {
      role: 'FACULTY',
      assignedCourses: assignments.map((a) => a.course),
      stats: {
        totalAssignedCourses: assignments.length,
        totalStudents,
      },
      upcomingClasses: recentClasses.map((c) => ({
        id: c.id,
        subject: c.subject?.name ?? 'N/A',
        course: c.course?.name ?? 'N/A',
        cohort: c.cohort?.name ?? 'N/A',
        date: c.date,
        startTime: c.startTime,
        endTime: c.endTime,
        room: c.room,
        topic: c.topic,
      })),
    };
  }

  // ─── Student ─────────────────────────────────────────────────────────────

  private async getStudentStats(studentId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        cohortId: true,
        enrollments: {
          include: {
            course: { select: { id: true, name: true, code: true, status: true } },
          },
        },
      },
    });

    const enrolledCourses =
      student?.enrollments.map((e) => ({
        id: e.course.id,
        name: e.course.name,
        code: e.course.code,
        status: e.course.status,
        enrolledAt: e.enrolledAt,
      })) ?? [];

    const upcomingClasses = student?.cohortId
      ? await this.prisma.classSchedule.findMany({
          where: { cohortId: student.cohortId },
          take: 5,
          include: {
            subject: { select: { name: true } },
            course: { select: { name: true, code: true } },
            faculty: { select: { firstName: true, lastName: true } },
          },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        })
      : [];

    return {
      role: 'STUDENT',
      enrolledCourses,
      stats: { totalEnrolledCourses: enrolledCourses.length },
      upcomingClasses: upcomingClasses.map((c) => ({
        id: c.id,
        subject: c.subject?.name ?? 'N/A',
        course: c.course?.name ?? 'N/A',
        date: c.date,
        startTime: c.startTime,
        endTime: c.endTime,
        room: c.room,
        topic: c.topic,
        facultyName: c.faculty
          ? `${c.faculty.firstName} ${c.faculty.lastName}`
          : 'N/A',
      })),
    };
  }
}
