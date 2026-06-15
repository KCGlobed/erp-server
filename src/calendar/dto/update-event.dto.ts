import { PartialType } from '@nestjs/swagger';
import { CreateAcademicEventDto } from './create-event.dto';

export class UpdateAcademicEventDto extends PartialType(CreateAcademicEventDto) {}
