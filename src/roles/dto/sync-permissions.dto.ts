import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SyncPermissionsDto {
  @ApiProperty({ type: [String], description: 'Array of permission IDs to assign to the role' })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
