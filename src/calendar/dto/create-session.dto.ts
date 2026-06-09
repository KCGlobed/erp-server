import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @ApiProperty({ example: 'Academic Year 2026' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
