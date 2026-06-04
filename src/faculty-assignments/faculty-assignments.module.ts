import { Module } from '@nestjs/common';
import { FacultyAssignmentsController } from './faculty-assignments.controller';
import { FacultyAssignmentsService } from './faculty-assignments.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FacultyAssignmentsController],
  providers: [FacultyAssignmentsService],
  exports: [FacultyAssignmentsService],
})
export class FacultyAssignmentsModule {}
