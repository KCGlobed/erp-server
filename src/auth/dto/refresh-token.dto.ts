import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Opaque refresh token from login or prior refresh' })
  @IsString()
  @MinLength(1)
  refreshToken: string;
}
