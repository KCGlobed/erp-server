import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ description: 'Role ID to assign' })
  @IsString()
  @MinLength(1)
  roleId: string;
}
