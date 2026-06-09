import {
  IsArray,
  IsDateString,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class StudentAttendanceDto {
  @ApiProperty({ description: 'The ID of the student' })
  @IsString()
  studentId: string;

  @ApiProperty({
    enum: AttendanceStatus,
    description: 'Attendance status for the student',
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class MarkAttendanceDto {
  @ApiProperty({
    description: 'The date the attendance is taken for',
    example: '2026-06-09T00:00:00.000Z',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    type: [StudentAttendanceDto],
    description: 'Array of student attendance records',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  records: StudentAttendanceDto[];
}
