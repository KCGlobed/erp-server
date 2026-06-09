import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FacultyProfileController } from './faculty-profile.controller';
import { FacultyProfileService } from './faculty-profile.service';
import { GcsService } from './gcs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, MulterModule.register({ storage: memoryStorage() })],
  controllers: [FacultyProfileController],
  providers: [FacultyProfileService, GcsService],
})
export class FacultyProfileModule {}
