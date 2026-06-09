import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModuleDto {
  @ApiProperty({ example: 'Module 1: Foundations' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSessionPlanDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  week: number;

  @ApiProperty({ example: 'Introduction to Accounting' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSubjectDto {
  @ApiProperty({ example: 'Financial Accounting' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ACC101' })
  @IsString()
  code: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  trimester: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  credits: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  learningOutcomes?: string;

  @ApiPropertyOptional({ type: [CreateModuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModuleDto)
  modules?: CreateModuleDto[];

  @ApiPropertyOptional({ type: [CreateSessionPlanDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSessionPlanDto)
  sessionPlans?: CreateSessionPlanDto[];
}
