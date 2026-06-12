import { Module } from '@nestjs/common';
import { StudentProfileController } from './student-profile.controller';
import { StudentProfileService } from './student-profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ExperienceModule } from '../experience/experience.module';

@Module({
  imports: [PrismaModule, ExperienceModule],
  controllers: [StudentProfileController],
  providers: [StudentProfileService],
})
export class StudentProfileModule {}
