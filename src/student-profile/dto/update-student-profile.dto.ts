import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Gender } from '@prisma/client';
import { IsFlexibleDate } from '../../common/decorators/is-flexible-date.decorator';
import { parseDateToDateTime } from '../../common/utils/date.util';
import { CreateExperienceDto } from '../../experience/dto/create-experience.dto';

export class UpdateStudentProfileDto {
  // ── Personal Information ──────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobileNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  emergencyContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyContactNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  parentGuardianName?: string;

  @ApiPropertyOptional({ description: 'Father | Mother | Guardian | Other' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  relationship?: string;

  @ApiPropertyOptional({ description: 'Required when relationship = Other' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specifyRelationship?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  parentGuardianPhoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  parentGuardianEmailId?: string;

  @ApiPropertyOptional({
    description:
      'Date of birth. Accepts: DDMMYY, MMDDYY, YYMMDD, DDMMYYYY, MMDDYYYY, YYYYMMDD, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD. Stored as DateTime (midnight UTC).',
    example: '15011995',
  })
  @IsOptional()
  @IsFlexibleDate()
  @Transform(({ value }) =>
    value ? parseDateToDateTime(value) ?? value : undefined,
  )
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pinCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  completeAddress?: string;

  // ── Academic — Class 10 ───────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  class10YearOfPassing?: string;

  @ApiPropertyOptional({ description: 'Percentage | CGPA' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  class10GradeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  class10Score?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  class10MediumOfInstruction?: string;

  // ── Academic — Class 12 ───────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  class12YearOfPassing?: string;

  @ApiPropertyOptional({ description: 'Percentage | CGPA' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  class12GradeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  class12Score?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  class12MediumOfInstruction?: string;

  // ── Academic — Undergraduate ──────────────────────────────────
  @ApiPropertyOptional({ description: 'Completed | Pursuing | NotApplicable' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  ugStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ugGradeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ugScore?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ugInstitutionName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ugMediumOfInstruction?: string;

  // ── Academic — Higher Qualification ──────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasHigherQualification?: boolean;

  @ApiPropertyOptional({ description: 'Required when hasHigherQualification = true' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  higherQualification?: string;

  @ApiPropertyOptional({
    description: 'Set true if the student has no prior work/internship experience.',
  })
  @IsOptional()
  @IsBoolean()
  isFresher?: boolean;

  @ApiPropertyOptional({
    description:
      'Experiences to upsert. Sending this array REPLACES all existing experiences. ' +
      'Omit the key entirely to leave existing experiences untouched. ' +
      'Send an empty array [] to clear all experiences.',
    type: [CreateExperienceDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExperienceDto)
  experiences?: CreateExperienceDto[];
}
