import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from './logger/logger.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { LogsModule } from './logs/logs.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { MailModule } from './mail/mail.module';
import { CoursesModule } from './courses/courses.module';
import { CohortsModule } from './cohorts/cohorts.module';
import { CalendarModule } from './calendar/calendar.module';
import { TimetableModule } from './timetable/timetable.module';
import { FacultyAssignmentsModule } from './faculty-assignments/faculty-assignments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FacultyProfileModule } from './faculty-profile/faculty-profile.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    PrismaModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    LogsModule,
    MailModule,
    CoursesModule,
    CohortsModule,
    CalendarModule,
    TimetableModule,
    FacultyAssignmentsModule,
    DashboardModule,
    FacultyProfileModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
