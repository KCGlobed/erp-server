import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { CreateAcademicEventDto } from './dto/create-event.dto';
import { UpdateAcademicEventDto } from './dto/update-event.dto';
import { CreateExamScheduleDto } from './dto/create-exam.dto';
import { AuthUser } from '../common/types/auth-user.type';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) { }

  // --- Academic Sessions ---

  async createSession(dto: CreateSessionDto) {
    const existing = await this.prisma.academicSession.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Session with name ${dto.name} already exists`,
      );
    }

    if (dto.isActive) {
      // Set all other sessions to inactive
      await this.prisma.academicSession.updateMany({
        data: { isActive: false },
      });
    }

    return this.prisma.academicSession.create({
      data: dto,
    });
  }

  async findAllSessions() {
    return this.prisma.academicSession.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  // --- Holidays ---

  async createHoliday(dto: CreateHolidayDto) {
    const { cohortIds, ...rest } = dto;
    return this.prisma.$transaction(async (tx) => {
      const holiday = await tx.holiday.create({
        data: rest,
      });

      if (cohortIds && cohortIds.length > 0) {
        for (const cid of cohortIds) {
          await tx.holidayCohort.create({
            data: {
              holidayId: holiday.id,
              cohortId: cid,
            },
          });
        }
      }

      return tx.holiday.findUnique({
        where: { id: holiday.id },
        include: { cohorts: { include: { cohort: true } } },
      });
    });
  }

  async findHolidays(currentUser: AuthUser) {
    const isAdmin =
      currentUser.roles.includes('SUPER_ADMIN') ||
      currentUser.roles.includes('ADMIN');

    if (isAdmin) {
      return this.prisma.holiday.findMany({
        include: { cohorts: { include: { cohort: true } } },
        orderBy: { startDate: 'asc' },
      });
    }

    // Role-based filter details
    const isStudent = currentUser.roles.includes('STUDENT');
    const isFaculty = currentUser.roles.includes('FACULTY');

    let targetCohortIds: string[] = [];

    if (isStudent) {
      const user = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { cohortId: true },
      });
      if (user?.cohortId) {
        targetCohortIds = [user.cohortId];
      }
    } else if (isFaculty) {
      const assignments = await this.prisma.facultyCohortAssignment.findMany({
        where: { userId: currentUser.id },
        select: { cohortId: true },
      });
      targetCohortIds = assignments.map((a) => a.cohortId);
    }

    // Holidays visible if:
    // 1. visibleToRoles is empty or contains the user's role
    // AND
    // 2. Mapped to target cohorts OR is global (has no cohorts associated with it)
    return this.prisma.holiday.findMany({
      where: {
        AND: [
          {
            OR: [
              { visibleToRoles: { hasSome: currentUser.roles } },
              { visibleToRoles: { equals: [] } },
            ],
          },
          {
            OR: [
              { cohorts: { none: {} } }, // global holiday
              { cohorts: { some: { cohortId: { in: targetCohortIds } } } },
            ],
          },
        ],
      },
      include: { cohorts: { include: { cohort: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  // --- Academic Events ---

  async createEvent(dto: CreateAcademicEventDto) {
    const { cohortIds, courseIds, facultyIds, ...rest } = dto;
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.academicEvent.create({
        data: rest,
      });

      if (cohortIds && cohortIds.length > 0) {
        for (const cid of cohortIds) {
          await tx.eventCohort.create({
            data: {
              eventId: event.id,
              cohortId: cid,
            },
          });
        }
      }

      if (courseIds && courseIds.length > 0) {
        for (const cid of courseIds) {
          await tx.eventCourse.create({
            data: {
              eventId: event.id,
              courseId: cid,
            },
          });
        }
      }

      if (facultyIds && facultyIds.length > 0) {
        for (const fid of facultyIds) {
          await tx.eventFaculty.create({
            data: {
              eventId: event.id,
              facultyId: fid,
            },
          });
        }
      }

      return tx.academicEvent.findUnique({
        where: { id: event.id },
        include: {
          cohorts: { include: { cohort: true } },
          courses: { include: { course: true } },
          faculties: { select: { faculty: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        },
      });
    });
  }

  async findEvents(currentUser: AuthUser) {
    const isAdmin =
      currentUser.roles.includes('SUPER_ADMIN') ||
      currentUser.roles.includes('ADMIN');

    if (isAdmin) {
      return this.prisma.academicEvent.findMany({
        include: {
          cohorts: { include: { cohort: true } },
          courses: { include: { course: true } },
          faculties: { select: { faculty: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        },
        orderBy: { startDate: 'asc' },
      });
    }

    const isStudent = currentUser.roles.includes('STUDENT');
    const isFaculty = currentUser.roles.includes('FACULTY');

    let targetCohortIds: string[] = [];
    let targetCourseIds: string[] = [];
    let targetFacultyIds: string[] = [];

    if (isStudent) {
      const user = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        select: {
          cohortId: true,
          enrollments: { select: { courseId: true } },
        },
      });
      if (user?.cohortId) {
        targetCohortIds = [user.cohortId];
      }
      if (user?.enrollments) {
        targetCourseIds = user.enrollments.map((e) => e.courseId);
      }

      const facultyAssignments = await this.prisma.user.findMany({
        where: {
          roles: { some: { role: { name: 'FACULTY' } } },
          OR: [
            { facultyCohorts: { some: { cohortId: { in: targetCohortIds } } } },
            { facultyAssignments: { some: { courseId: { in: targetCourseIds } } } },
          ],
        },
        select: { id: true },
      });
      targetFacultyIds = facultyAssignments.map((f) => f.id);

    } else if (isFaculty) {
      const [cohortAssignments, courseAssignments] = await Promise.all([
        this.prisma.facultyCohortAssignment.findMany({
          where: { userId: currentUser.id },
          select: { cohortId: true },
        }),
        this.prisma.facultyCourseAssignment.findMany({
          where: { userId: currentUser.id },
          select: { courseId: true },
        }),
      ]);
      targetCohortIds = cohortAssignments.map((a) => a.cohortId);
      targetCourseIds = courseAssignments.map((a) => a.courseId);
    }

    return this.prisma.academicEvent.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { visibleToRoles: { hasSome: currentUser.roles } },
              { visibleToRoles: { equals: [] } },
            ],
          },
          {
            OR: [
              // Global
              {
                AND: [{ cohorts: { none: {} } }, { courses: { none: {} } }, { faculties: { none: {} } }],
              },
              // Cohort specific
              { cohorts: { some: { cohortId: { in: targetCohortIds } } } },
              // Course specific
              { courses: { some: { courseId: { in: targetCourseIds } } } },
              // Faculty specific
              isFaculty
                ? { faculties: { some: { facultyId: currentUser.id } } }
                : { faculties: { some: { facultyId: { in: targetFacultyIds } } } },
            ],
          },
        ],
      },
      include: {
        cohorts: { include: { cohort: true } },
        courses: { include: { course: true } },
        faculties: { select: { faculty: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async updateEvent(id: string, dto: UpdateAcademicEventDto) {
    const { cohortIds, courseIds, facultyIds, ...rest } = dto;
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.academicEvent.update({
        where: { id },
        data: rest,
      });

      if (cohortIds !== undefined) {
        await tx.eventCohort.deleteMany({ where: { eventId: id } });
        if (cohortIds.length > 0) {
          await tx.eventCohort.createMany({
            data: cohortIds.map((cid) => ({ eventId: id, cohortId: cid })),
          });
        }
      }

      if (courseIds !== undefined) {
        await tx.eventCourse.deleteMany({ where: { eventId: id } });
        if (courseIds.length > 0) {
          await tx.eventCourse.createMany({
            data: courseIds.map((cid) => ({ eventId: id, courseId: cid })),
          });
        }
      }

      if (facultyIds !== undefined) {
        await tx.eventFaculty.deleteMany({ where: { eventId: id } });
        if (facultyIds.length > 0) {
          await tx.eventFaculty.createMany({
            data: facultyIds.map((fid) => ({ eventId: id, facultyId: fid })),
          });
        }
      }

      return tx.academicEvent.findUnique({
        where: { id },
        include: {
          cohorts: { include: { cohort: true } },
          courses: { include: { course: true } },
          faculties: { select: { faculty: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        },
      });
    });
  }

  async deleteEvent(id: string) {
    return this.prisma.academicEvent.delete({
      where: { id },
    });
  }

  // --- Exams ---

  async createExam(dto: CreateExamScheduleDto, currentUser: AuthUser) {
    // Validate subject & cohort
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const cohort = await this.prisma.cohort.findUnique({
      where: { id: dto.cohortId },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');

    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });
      if (!course) throw new NotFoundException('Course not found');
    }

    return this.prisma.examSchedule.create({
      data: {
        ...dto,
        createdById: currentUser.id,
      },
      include: {
        subject: true,
        cohort: true,
        course: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findExams(currentUser: AuthUser) {
    const isAdmin =
      currentUser.roles.includes('SUPER_ADMIN') ||
      currentUser.roles.includes('ADMIN');

    if (isAdmin) {
      return this.prisma.examSchedule.findMany({
        include: {
          subject: true,
          cohort: true,
          course: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { date: 'asc' },
      });
    }

    const isStudent = currentUser.roles.includes('STUDENT');
    const isFaculty = currentUser.roles.includes('FACULTY');

    if (isStudent) {
      const user = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { cohortId: true },
      });

      if (!user?.cohortId) return [];

      return this.prisma.examSchedule.findMany({
        where: {
          cohortId: user.cohortId,
          isActive: true
        },
        include: {
          subject: true,
          cohort: true,
          course: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { date: 'asc' },
      });
    }

    if (isFaculty) {
      // Faculty see exams for their assigned cohorts or where they are the invigilator or creator
      const cohortAssignments =
        await this.prisma.facultyCohortAssignment.findMany({
          where: { userId: currentUser.id },
          select: { cohortId: true },
        });
      const cohortIds = cohortAssignments.map((a) => a.cohortId);

      return this.prisma.examSchedule.findMany({
        where: {
          OR: [
            { createdById: currentUser.id },
            { cohortId: { in: cohortIds } },
          ],
        },
        include: {
          subject: true,
          cohort: true,
          course: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { date: 'asc' },
      });
    }

    return [];
  }

  async updateExam(id: string, dto: any, currentUser: AuthUser) {
    const exam = await this.prisma.examSchedule.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');

    const isAdmin = currentUser.roles.includes('SUPER_ADMIN') || currentUser.roles.includes('ADMIN');
    if (!isAdmin && exam.createdById !== currentUser.id) {
      throw new ConflictException('You do not have permission to update this exam');
    }

    return this.prisma.examSchedule.update({
      where: { id },
      data: dto,
      include: {
        subject: true,
        cohort: true,
        course: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async deleteExam(id: string, currentUser: AuthUser) {
    const exam = await this.prisma.examSchedule.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');

    const isAdmin = currentUser.roles.includes('SUPER_ADMIN') || currentUser.roles.includes('ADMIN');
    if (!isAdmin && exam.createdById !== currentUser.id) {
      throw new ConflictException('You do not have permission to delete this exam');
    }

    return this.prisma.examSchedule.delete({
      where: { id },
    });
  }
}
