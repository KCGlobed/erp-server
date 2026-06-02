import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CohortStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCohortDto {
  @ApiProperty({ example: 'Cohort 2026' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2027-06-01T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({ enum: CohortStatus })
  @IsOptional()
  @IsEnum(CohortStatus)
  status?: CohortStatus;
}
