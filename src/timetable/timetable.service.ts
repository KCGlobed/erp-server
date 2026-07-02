import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { AuthUser } from '../common/types/auth-user.type';

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  async createSchedule(dto: CreateScheduleDto) {
    // 1. Validations
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const cohort = await this.prisma.cohort.findUnique({
      where: { id: dto.cohortId },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');

    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const faculty = await this.prisma.user.findUnique({
      where: { id: dto.facultyId },
      include: { roles: { include: { role: true } } },
    });
    if (!faculty) throw new NotFoundException('Faculty user not found');
    const isFaculty = faculty.roles.some(
      (r) =>
        r.role.name === 'FACULTY' ||
        r.role.name === 'SUPER_ADMIN' ||
        r.role.name === 'ADMIN',
    );
    if (!isFaculty)
      throw new BadRequestException('Assigned user must be a faculty member');

    // 2. Conflict Checks
    // Check if room, faculty, or cohort has a booking that overlaps with the new class schedule
    const conflict = await this.prisma.classSchedule.findFirst({
      where: {
        date: dto.date,
        OR: [
          // Same room overlap
          {
            room: dto.room,
            startTime: { lt: dto.endTime },
            endTime: { gt: dto.startTime },
          },
          // Same faculty overlap
          {
            facultyId: dto.facultyId,
            startTime: { lt: dto.endTime },
            endTime: { gt: dto.startTime },
          },
          // Same cohort overlap
          {
            cohortId: dto.cohortId,
            startTime: { lt: dto.endTime },
            endTime: { gt: dto.startTime },
          },
        ],
      },
      include: {
        faculty: { select: { firstName: true, lastName: true } },
        cohort: { select: { name: true } },
      },
    });

    if (conflict) {
      if (conflict.room === dto.room) {
        throw new ConflictException(
          `Room ${dto.room} is already booked for class from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`,
        );
      }
      if (conflict.facultyId === dto.facultyId) {
        throw new ConflictException(
          `Faculty member ${conflict.faculty.firstName} ${conflict.faculty.lastName} is already scheduled to teach from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`,
        );
      }
      if (conflict.cohortId === dto.cohortId) {
        throw new ConflictException(
          `Cohort ${conflict.cohort.name} is already scheduled for another class from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`,
        );
      }
    }

    return this.prisma.classSchedule.create({
      data: dto,
      include: {
        course: true,
        cohort: true,
        subject: true,
        faculty: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findAllSchedules() {
    return this.prisma.classSchedule.findMany({
      include: {
        course: true,
        cohort: true,
        subject: true,
        faculty: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getPersonalizedCalendar(currentUser: AuthUser) {
    const isAdmin =
      currentUser.roles.includes('SUPER_ADMIN') ||
      currentUser.roles.includes('ADMIN');

    // 1. Fetch Classes
    let classes: any[] = [];
    let targetCohortIds: string[] = [];
    let targetCourseIds: string[] = [];

    if (isAdmin) {
      classes = await this.prisma.classSchedule.findMany({
        include: {
          course: true,
          cohort: true,
          subject: true,
          faculty: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });
    } else if (currentUser.roles.includes('STUDENT')) {
      const student = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        select: {
          cohortId: true,
          enrollments: { select: { courseId: true } },
        },
      });

      if (student?.cohortId) {
        targetCohortIds = [student.cohortId];
        targetCourseIds = student.enrollments.map((e) => e.courseId);

        classes = await this.prisma.classSchedule.findMany({
          where: {
            cohortId: student.cohortId,
            courseId: { in: targetCourseIds },
          },
          include: {
            course: true,
            cohort: true,
            subject: true,
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });
      }
    } else if (currentUser.roles.includes('FACULTY')) {
      const cohortAssignments =
        await this.prisma.facultyCohortAssignment.findMany({
          where: { userId: currentUser.id },
          select: { cohortId: true },
        });
      const courseAssignments =
        await this.prisma.facultyCourseAssignment.findMany({
          where: { userId: currentUser.id },
          select: { courseId: true },
        });

      targetCohortIds = cohortAssignments.map((a) => a.cohortId);
      targetCourseIds = courseAssignments.map((a) => a.courseId);

      classes = await this.prisma.classSchedule.findMany({
        where: {
          facultyId: currentUser.id,
        },
        include: {
          course: true,
          cohort: true,
          subject: true,
          faculty: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });
    }

    // 2. Fetch Holidays
    let holidayWhere: any = {};
    if (!isAdmin) {
      holidayWhere = {
        AND: [
          {
            OR: [
              { visibleToRoles: { hasSome: currentUser.roles } },
              { visibleToRoles: { equals: [] } },
            ],
          },
          {
            OR: [
              { cohorts: { none: {} } },
              { cohorts: { some: { cohortId: { in: targetCohortIds } } } },
            ],
          },
        ],
      };
    }
    const holidays = await this.prisma.holiday.findMany({
      where: holidayWhere,
      orderBy: { startDate: 'asc' },
    });

    // 3. Fetch Events
    let eventWhere: any = {};
    if (!isAdmin) {
      eventWhere = {
        AND: [
          {
            OR: [
              { visibleToRoles: { hasSome: currentUser.roles } },
              { visibleToRoles: { equals: [] } },
            ],
          },
          {
            OR: [
              {
                AND: [{ cohorts: { none: {} } }, { courses: { none: {} } }],
              },
              { cohorts: { some: { cohortId: { in: targetCohortIds } } } },
              { courses: { some: { courseId: { in: targetCourseIds } } } },
            ],
          },
        ],
      };
    }
    const events = await this.prisma.academicEvent.findMany({
      where: eventWhere,
      orderBy: { startDate: 'asc' },
    });

    // 4. Fetch Exams
    let examWhere: any = {};
    if (!isAdmin) {
      if (currentUser.roles.includes('STUDENT')) {
        examWhere = { cohortId: { in: targetCohortIds } };
      } else if (currentUser.roles.includes('FACULTY')) {
        examWhere = {
          cohortId: { in: targetCohortIds },
        };
      } else {
        examWhere = { id: 'none' };
      }
    }
    const exams = await this.prisma.examSchedule.findMany({
      where: examWhere,
      include: { subject: true, cohort: true },
      orderBy: { date: 'asc' },
    });

    return {
      classes,
      holidays,
      events,
      exams,
    };
  }
}
