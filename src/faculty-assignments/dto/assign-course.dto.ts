import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCourseDto {
  @ApiProperty({ description: 'Faculty user ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Course ID to assign' })
  @IsString()
  courseId: string;
}
