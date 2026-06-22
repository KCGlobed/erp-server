import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, IsString, IsInt, IsBoolean } from 'class-validator';
import { AssessmentType, ExamFormat } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateExamScheduleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiProperty()
  @IsString()
  cohortId: string;

  @ApiProperty({ example: '2026-06-15T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: '2026-06-15T09:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({ example: '2026-06-15T12:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  room?: string;

  @ApiProperty({ enum: AssessmentType })
  @IsEnum(AssessmentType)
  type: AssessmentType;

  @ApiPropertyOptional({ enum: ExamFormat })
  @IsOptional()
  @IsEnum(ExamFormat)
  examFormat?: ExamFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  marks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  numQuestions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

}
