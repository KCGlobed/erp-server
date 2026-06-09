import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

/**
 * E2E TESTS — Full application stack
 *
 * Boots a real NestJS + Fastify application in test mode.
 * PrismaService is mocked — no real DB connection.
 *
 * Uses Fastify's built-in `inject()` for HTTP testing
 * (faster than spawning a real HTTP server).
 */
describe('AppController (E2E)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    systemLog: {
      create: jest.fn().mockResolvedValue({ id: '1' }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Health / Root ────────────────────────────────────────────────────────

  it('GET /api should return 200 and Hello World!', async () => {
    const response = await app
      .getHttpAdapter()
      .getInstance()
      .inject({ method: 'GET', url: '/api' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Hello World!');
  });

  // ─── 404 for unknown routes ───────────────────────────────────────────────

  it('GET /api/unknown-route should return 404', async () => {
    const response = await app
      .getHttpAdapter()
      .getInstance()
      .inject({ method: 'GET', url: '/api/this-route-does-not-exist' });

    expect(response.statusCode).toBe(404);
  });

  // ─── Method not allowed ───────────────────────────────────────────────────

  it('POST /api should return 404 (no POST handler on root)', async () => {
    const response = await app
      .getHttpAdapter()
      .getInstance()
      .inject({ method: 'POST', url: '/api' });

    expect(response.statusCode).toBe(404);
  });

  // ─── Headers ──────────────────────────────────────────────────────────────

  it('GET /api response should have content-type header', async () => {
    const response = await app
      .getHttpAdapter()
      .getInstance()
      .inject({ method: 'GET', url: '/api' });

    expect(response.headers['content-type']).toBeDefined();
  });
});
