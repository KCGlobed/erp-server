import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { LinkCourseDto } from './dto/link-course.dto';

@Injectable()
export class CohortsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCohortDto) {
    const existing = await this.prisma.cohort.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Cohort with name ${dto.name} already exists`,
      );
    }

    return this.prisma.cohort.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.cohort.findMany({
      include: {
        cohortCourses: {
          include: {
            course: true,
            curriculum: true,
          },
        },
        _count: {
          select: {
            students: true,
            facultyCohorts: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id },
      include: {
        cohortCourses: {
          include: {
            course: true,
            curriculum: true,
          },
        },
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
        },
        facultyCohorts: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!cohort) {
      throw new NotFoundException('Cohort not found');
    }
    return cohort;
  }

  async update(id: string, dto: UpdateCohortDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.cohort.findUnique({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Cohort with name ${dto.name} already exists`,
        );
      }
    }

    return this.prisma.cohort.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cohort.delete({
      where: { id },
    });
  }

  // --- Link Course Curriculum ---

  async linkCourse(cohortId: string, dto: LinkCourseDto) {
    await this.findOne(cohortId);

    // Validate course & curriculum exist
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id: dto.curriculumId },
    });
    if (!curriculum)
      throw new NotFoundException('Curriculum version not found');

    if (curriculum.courseId !== dto.courseId) {
      throw new BadRequestException(
        'This curriculum version does not belong to the selected course',
      );
    }

    return this.prisma.cohortCourse.upsert({
      where: {
        cohortId_courseId: { cohortId, courseId: dto.courseId },
      },
      create: {
        cohortId,
        courseId: dto.courseId,
        curriculumId: dto.curriculumId,
      },
      update: {
        curriculumId: dto.curriculumId,
      },
      include: {
        course: true,
        curriculum: true,
      },
    });
  }

  // --- Student Assignment & Enrollments ---

  async assignStudents(cohortId: string, studentIds: string[]) {
    const cohort = await this.findOne(cohortId);

    // Get linked courses for auto-enrollment
    const linkedCourses = await this.prisma.cohortCourse.findMany({
      where: { cohortId },
    });

    return this.prisma.$transaction(async (tx) => {
      for (const studentId of studentIds) {
        // Validate user exists and is a STUDENT
        const user = await tx.user.findUnique({
          where: { id: studentId },
          include: { roles: { include: { role: true } } },
        });

        if (!user) {
          throw new NotFoundException(
            `Student user with ID ${studentId} not found`,
          );
        }

        const isStudent = user.roles.some(
          (r) =>
            r.role.name === 'STUDENT' ||
            r.role.name === 'SUPER_ADMIN' ||
            r.role.name === 'ADMIN',
        );
        if (!isStudent) {
          throw new BadRequestException(
            `User ${user.email} does not have the STUDENT role`,
          );
        }

        // Set cohort
        await tx.user.update({
          where: { id: studentId },
          data: { cohortId },
        });

        // Auto-enroll in all courses linked to this cohort
        for (const lc of linkedCourses) {
          await tx.courseEnrollment.upsert({
            where: {
              userId_courseId: { userId: studentId, courseId: lc.courseId },
            },
            create: {
              userId: studentId,
              courseId: lc.courseId,
            },
            update: {},
          });
        }
      }

      return {
        message: `${studentIds.length} students assigned to cohort and auto-enrolled in courses`,
      };
    });
  }

  async enrollStudentCourses(studentId: string, courseIds: string[]) {
    // Validate student user
    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('Student user not found');

    const isStudent = user.roles.some(
      (r) =>
        r.role.name === 'STUDENT' ||
        r.role.name === 'SUPER_ADMIN' ||
        r.role.name === 'ADMIN',
    );
    if (!isStudent)
      throw new BadRequestException('User does not have the STUDENT role');

    return this.prisma.$transaction(async (tx) => {
      for (const courseId of courseIds) {
        const course = await tx.course.findUnique({ where: { id: courseId } });
        if (!course)
          throw new NotFoundException(`Course with ID ${courseId} not found`);

        await tx.courseEnrollment.upsert({
          where: {
            userId_courseId: { userId: studentId, courseId },
          },
          create: {
            userId: studentId,
            courseId,
          },
          update: {},
        });
      }
      return { message: `Student enrolled in ${courseIds.length} courses` };
    });
  }

  // --- Faculty Assignment ---

  async assignFaculty(cohortId: string, facultyIds: string[]) {
    await this.findOne(cohortId);

    return this.prisma.$transaction(async (tx) => {
      for (const facultyId of facultyIds) {
        // Validate user is FACULTY
        const user = await tx.user.findUnique({
          where: { id: facultyId },
          include: { roles: { include: { role: true } } },
        });

        if (!user) {
          throw new NotFoundException(
            `Faculty user with ID ${facultyId} not found`,
          );
        }

        const isFaculty = user.roles.some(
          (r) =>
            r.role.name === 'FACULTY' ||
            r.role.name === 'SUPER_ADMIN' ||
            r.role.name === 'ADMIN',
        );
        if (!isFaculty) {
          throw new BadRequestException(
            `User ${user.email} does not have the FACULTY role`,
          );
        }

        await tx.facultyCohortAssignment.upsert({
          where: {
            userId_cohortId: { userId: facultyId, cohortId },
          },
          create: {
            userId: facultyId,
            cohortId,
          },
          update: {},
        });
      }
      return { message: `${facultyIds.length} faculty assigned to cohort` };
    });
  }

  async assignFacultyCourses(facultyId: string, courseIds: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: facultyId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('Faculty user not found');

    const isFaculty = user.roles.some(
      (r) =>
        r.role.name === 'FACULTY' ||
        r.role.name === 'SUPER_ADMIN' ||
        r.role.name === 'ADMIN',
    );
    if (!isFaculty)
      throw new BadRequestException('User does not have the FACULTY role');

    return this.prisma.$transaction(async (tx) => {
      for (const courseId of courseIds) {
        const course = await tx.course.findUnique({ where: { id: courseId } });
        if (!course)
          throw new NotFoundException(`Course with ID ${courseId} not found`);

        await tx.facultyCourseAssignment.upsert({
          where: {
            userId_courseId: { userId: facultyId, courseId },
          },
          create: {
            userId: facultyId,
            courseId,
          },
          update: {},
        });
      }
      return { message: `Faculty assigned to ${courseIds.length} courses` };
    });
  }
}
