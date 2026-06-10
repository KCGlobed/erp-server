import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AuthUser } from '../common/types/auth-user.type';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getClassAttendance(classScheduleId: string) {
    const classSchedule = await this.prisma.classSchedule.findUnique({
      where: { id: classScheduleId },
      include: {
        classAttendance: {
          include: {
            records: true,
          },
        },
      },
    });

    if (!classSchedule) {
      throw new NotFoundException('Class schedule not found');
    }

    return classSchedule.classAttendance;
  }

  async markAttendance(
    classScheduleId: string,
    dto: MarkAttendanceDto,
    user: AuthUser,
  ) {
    const classSchedule = await this.prisma.classSchedule.findUnique({
      where: { id: classScheduleId },
    });

    if (!classSchedule) {
      throw new NotFoundException('Class schedule not found');
    }

    if (
      classSchedule.facultyId !== user.id &&
      user.roles &&
      !user.roles.includes('ADMIN') &&
      !user.roles.includes('SUPER_ADMIN')
    ) {
      throw new ForbiddenException(
        'Only the assigned faculty can mark attendance for this class',
      );
    }

    const { date, records } = dto;

    // Use Prisma transaction to ensure atomic updates
    const result = await this.prisma.$transaction(async (prisma) => {
      // Upsert the parent ClassAttendance record
      const classAttendance = await prisma.classAttendance.upsert({
        where: {
          classScheduleId: classScheduleId,
        },
        update: {
          date: new Date(date),
          facultyId: user.id, // Update faculty just in case
        },
        create: {
          classScheduleId: classScheduleId,
          facultyId: user.id,
          date: new Date(date),
        },
      });

      // Upsert the individual student records
      const studentRecordsPromises = records.map((record) =>
        prisma.studentAttendanceRecord.upsert({
          where: {
            classAttendanceId_studentId: {
              classAttendanceId: classAttendance.id,
              studentId: record.studentId,
            },
          },
          update: {
            status: record.status,
          },
          create: {
            classAttendanceId: classAttendance.id,
            studentId: record.studentId,
            status: record.status,
          },
        }),
      );

      await Promise.all(studentRecordsPromises);

      return classAttendance;
    });

    return {
      message: 'Attendance marked successfully',
      classAttendanceId: result.id,
    };
  }

  async getStudentAttendance(studentId: string) {
    const records = await this.prisma.studentAttendanceRecord.findMany({
      where: { studentId },
      include: {
        classAttendance: {
          include: {
            classSchedule: true,
          },
        },
      },
    });

    return records.map((r) => ({
      status: r.status,
      date: r.classAttendance.date,
      courseId: r.classAttendance.classSchedule.courseId,
      topic: r.classAttendance.classSchedule.topic,
    }));
  }
}
