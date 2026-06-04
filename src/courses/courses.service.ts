import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { AuthUser } from '../common/types/auth-user.type';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    const existing = await this.prisma.course.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Course with code ${dto.code} already exists`);
    }

    return this.prisma.course.create({
      data: dto,
    });
  }

  async findAll(currentUser?: AuthUser) {
    let courseIdFilter: string[] | undefined;

    if (currentUser?.roles.includes('FACULTY')) {
      const assignments = await this.prisma.facultyCourseAssignment.findMany({
        where: { userId: currentUser.id },
        select: { courseId: true },
      });
      courseIdFilter = assignments.map((a) => a.courseId);
    }

    return this.prisma.course.findMany({
      where: courseIdFilter !== undefined ? { id: { in: courseIdFilter } } : undefined,
      include: {
        curriculums: {
          include: {
            subjects: true,
            _count: { select: { subjects: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        curriculums: {
          include: {
            subjects: {
              include: {
                modules: true,
                sessionPlans: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course not found`);
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.course.findUnique({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Course with code ${dto.code} already exists`);
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.course.delete({
      where: { id },
    });
  }

  // --- Curriculum Methods ---

  async createCurriculum(courseId: string, dto: CreateCurriculumDto) {
    // Check if course exists
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    // Check version uniqueness for the course
    const existing = await this.prisma.curriculum.findUnique({
      where: {
        courseId_version: {
          courseId,
          version: dto.version,
        },
      },
    });
    if (existing) {
      throw new ConflictException(`Curriculum version ${dto.version} already exists for this course`);
    }

    return this.prisma.curriculum.create({
      data: {
        courseId,
        version: dto.version,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findCurriculums(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.curriculum.findMany({
      where: { courseId },
      include: {
        subjects: {
          include: {
            modules: { include: { topics: true } },
            sessionPlans: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Subject Methods ---

  async createSubject(curriculumId: string, dto: CreateSubjectDto) {
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id: curriculumId },
      include: { course: true },
    });
    if (!curriculum) throw new NotFoundException('Curriculum version not found');

    if (dto.trimester > curriculum.course.numTrimesters) {
      throw new ConflictException(
        `Trimester ${dto.trimester} exceeds the course's total trimesters limit of ${curriculum.course.numTrimesters}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const subject = await tx.subject.create({
        data: {
          curriculumId,
          name: dto.name,
          code: dto.code,
          trimester: dto.trimester,
          credits: dto.credits,
          learningOutcomes: dto.learningOutcomes,
        },
      });

      if (dto.modules && dto.modules.length > 0) {
        for (const m of dto.modules) {
          await tx.module.create({
            data: {
              subjectId: subject.id,
              name: m.name,
              description: m.description,
            },
          });
        }
      }

      if (dto.sessionPlans && dto.sessionPlans.length > 0) {
        for (const sp of dto.sessionPlans) {
          await tx.sessionPlan.create({
            data: {
              subjectId: subject.id,
              week: sp.week,
              title: sp.title,
              description: sp.description,
            },
          });
        }
      }

      return tx.subject.findUnique({
        where: { id: subject.id },
        include: {
          modules: true,
          sessionPlans: true,
        },
      });
    });
  }

  async findSubjects(curriculumId: string) {
    const curriculum = await this.prisma.curriculum.findUnique({ where: { id: curriculumId } });
    if (!curriculum) throw new NotFoundException('Curriculum version not found');

    return this.prisma.subject.findMany({
      where: { curriculumId },
      include: {
        modules: { include: { topics: true } },
        sessionPlans: true,
        assessments: true,
      },
      orderBy: [{ trimester: 'asc' }, { name: 'asc' }],
    });
  }
}
