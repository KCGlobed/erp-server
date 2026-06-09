import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ROLE_NAMES } from '../../common/constants/rbac.constants';

export class RegisterDto {
  @ApiProperty({ example: 'john@school.com' })
  @IsEmail()
  email: string;

  // @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  // @IsString()
  // @MinLength(8)
  // @MaxLength(72)
  // password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'STUDENT', enum: Object.values(ROLE_NAMES) })
  @IsOptional()
  @IsEnum(Object.values(ROLE_NAMES))
  role?: string;
}
