import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Gender } from '@prisma/client';
import { IsFlexibleDate } from '../../common/decorators/is-flexible-date.decorator';
import { parseDateToDateTime } from '../../common/utils/date.util';
import { CreateExperienceDto } from '../../experience/dto/create-experience.dto';

export class UpdateFacultyProfileDto {
  @ApiPropertyOptional({ description: 'Public URL of the profile photo' })
  @IsOptional()
  @IsUrl()
  profilePhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Public URL of the profile banner' })
  @IsOptional()
  @IsUrl()
  profileBannerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;


  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  personalEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobileNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  alternateMobileNumber?: string;

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
  @MaxLength(500)
  currentAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  permanentAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  experienceYears?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  experienceDescription?: string;

  @ApiPropertyOptional({
    description:
      'Date of birth. Accepts: DDMMYY, MMDDYY, YYMMDD, DDMMYYYY, MMDDYYYY, YYYYMMDD, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD. Stored as DateTime (midnight UTC).',
    example: '15011990',
  })
  @IsOptional()
  @IsFlexibleDate()
  @Transform(({ value }) =>
    value ? parseDateToDateTime(value) ?? value : undefined,
  )
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description:
      'Date of joining. Accepts: DDMMYY, MMDDYY, YYMMDD, DDMMYYYY, MMDDYYYY, YYYYMMDD, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD. Stored as DateTime (midnight UTC).',
    example: '01062020',
  })
  @IsOptional()
  @IsFlexibleDate()
  @Transform(({ value }) =>
    value ? parseDateToDateTime(value) ?? value : undefined,
  )
  dateOfJoining?: string;

  @ApiPropertyOptional({
    description: 'Set true if the faculty member has no prior work experience.',
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

