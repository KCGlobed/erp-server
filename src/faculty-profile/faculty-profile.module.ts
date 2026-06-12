import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FacultyProfileController } from './faculty-profile.controller';
import { FacultyProfileService } from './faculty-profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ExperienceModule } from '../experience/experience.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({ storage: memoryStorage() }),
    ExperienceModule,
    StorageModule,
  ],
  controllers: [FacultyProfileController],
  providers: [FacultyProfileService],
})
export class FacultyProfileModule {}
