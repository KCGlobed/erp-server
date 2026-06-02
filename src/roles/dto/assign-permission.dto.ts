import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  permissionId: string;
}
