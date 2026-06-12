import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === 'development',
    }),
    {
      bufferLogs: true,
    },
  );

  // ─── Security & CORS ─────────────────────────────────────────────────
  await app.register(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@fastify/helmet'),
    {
      contentSecurityPolicy: false, // Disable CSP for API servers
    },
  );

  await app.register(
    require('@fastify/multipart'),
    {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    },
  );

  await app.register(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@fastify/cors'),
    {
      origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [
        'http://localhost:5173',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  );

  // ─── Global Pipes ─────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── API Versioning ───────────────────────────────────────────────────
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('School ERP API')
    .setDescription(
      'JWT access + rotating refresh tokens, RBAC, users, roles, permissions, and system logs.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
  });

  // ─── Start ────────────────────────────────────────────────────────────
  const port = parseInt(process.env.PORT ?? '3000', 10);
  const host = '0.0.0.0'; // Required for Fastify to bind properly

  await app.listen(port, host);

  logger.log(`🚀 Application running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  logger.log(`📦 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  logger.log(`🔧 HTTP Adapter: Fastify`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});
