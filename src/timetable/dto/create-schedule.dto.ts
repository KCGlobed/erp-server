import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: '2026-06-01T09:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({ example: '2026-06-01T10:30:00.000Z' })
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty()
  @IsString()
  cohortId: string;

  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiProperty()
  @IsString()
  facultyId: string;

  @ApiProperty({ example: 'A101' })
  @IsString()
  room: string;

  @ApiPropertyOptional()
  @IsString()
  topic?: string;
}
