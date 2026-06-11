import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Gender } from '@prisma/client';
import { IsFlexibleDate } from '../../common/decorators/is-flexible-date.decorator';
import { parseFlexibleDate } from '../../common/utils/date.util';

export class UpdateFacultyProfileDto {
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
  @IsUrl()
  profilePhotoUrl?: string;

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
      'Date of birth. Accepts: DDMMYY, MMDDYY, YYMMDD, DDMMYYYY, MMDDYYYY, YYYYMMDD, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD. Stored as YYYY-MM-DD.',
    example: '15011990',
  })
  @IsOptional()
  @IsFlexibleDate()
  @Transform(({ value }) =>
    value ? parseFlexibleDate(value) ?? value : undefined,
  )
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description:
      'Date of joining. Accepts: DDMMYY, MMDDYY, YYMMDD, DDMMYYYY, MMDDYYYY, YYYYMMDD, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD. Stored as YYYY-MM-DD.',
    example: '01062020',
  })
  @IsOptional()
  @IsFlexibleDate()
  @Transform(({ value }) =>
    value ? parseFlexibleDate(value) ?? value : undefined,
  )
  dateOfJoining?: string;
}
