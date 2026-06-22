import { PartialType } from '@nestjs/swagger';
import { CreateExamScheduleDto } from './create-exam.dto';

export class UpdateExamScheduleDto extends PartialType(CreateExamScheduleDto) {}
