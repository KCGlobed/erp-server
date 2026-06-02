import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CourseStatus } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty({ example: 'MBA' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'MBA-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ example: '2 years' })
  @IsString()
  duration: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  numTrimesters?: number;

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}
