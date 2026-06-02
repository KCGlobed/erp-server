import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { HolidayType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateHolidayDto {
  @ApiProperty({ example: 'National Day' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2026-12-02T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2026-12-02T23:59:59.000Z' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ enum: HolidayType })
  @IsEnum(HolidayType)
  type: HolidayType;

  @ApiPropertyOptional({ example: ['FACULTY'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibleToRoles?: string[];

  @ApiPropertyOptional({ example: ['cohort_id_1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cohortIds?: string[];
}
