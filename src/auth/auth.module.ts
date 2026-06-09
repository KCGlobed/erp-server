import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(
          'JWT_ACCESS_SECRET',
          'dev-access-secret-change-me',
        ),
        signOptions: {
          expiresIn: config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
