import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LinkCourseDto {
  @ApiProperty({ example: 'course_id_here' })
  @IsString()
  courseId: string;

  @ApiProperty({ example: 'curriculum_id_here' })
  @IsString()
  curriculumId: string;
}
