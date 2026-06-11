import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsFlexibleDate } from '../../common/decorators/is-flexible-date.decorator';
import { parseDateToDateTime } from '../../common/utils/date.util';

export class CreateExperienceDto {
  @ApiProperty({ description: 'Name of the organisation', example: 'Infosys Ltd.' })
  @IsString()
  @MaxLength(200)
  organizationName: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @MaxLength(100)
  designation: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @MaxLength(100)
  functionalArea: string;

  @ApiProperty({
    description:
      'Start date. Accepts: DDMMYY, MMDDYY, YYMMDD, DDMMYYYY, MMDDYYYY, YYYYMMDD, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD.',
    example: '01062018',
  })
  @IsFlexibleDate()
  @Transform(({ value }) => (value ? parseDateToDateTime(value) ?? value : undefined))
  fromDate: string;

  @ApiPropertyOptional({
    description:
      'End date. Leave null / omit if currently working here. Same formats as fromDate.',
    example: '01062022',
  })
  @IsOptional()
  @IsFlexibleDate()
  @Transform(({ value }) => (value ? parseDateToDateTime(value) ?? value : undefined))
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Set true if this is the current/ongoing role (toDate should be omitted).',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isCurrentRole?: boolean;
}
