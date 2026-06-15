import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { AcademicEventType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateAcademicEventDto {
  @ApiProperty({ example: 'Orientation Ceremony' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-06-01T09:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ enum: AcademicEventType })
  @IsEnum(AcademicEventType)
  type: AcademicEventType;

  @ApiPropertyOptional({ example: ['FACULTY'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibleToRoles?: string[];

  @ApiPropertyOptional({ example: ['cohort_id'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cohortIds?: string[];

  @ApiPropertyOptional({ example: ['course_id'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  courseIds?: string[];

  @ApiPropertyOptional({ example: ['faculty_id'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facultyIds?: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  isActive?: boolean;
}
