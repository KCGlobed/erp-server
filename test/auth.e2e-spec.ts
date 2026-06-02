import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';

describe('Auth (E2E)', () => {
  let app: INestApplication;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({
      accessToken: 'mock-access',
      refreshToken: 'mock-refresh',
      expiresIn: '15m',
    }),
    login: jest.fn().mockResolvedValue({
      accessToken: 'mock-access',
      refreshToken: 'mock-refresh',
      expiresIn: '15m',
    }),
    refresh: jest.fn().mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      expiresIn: '15m',
    }),
    logout: jest.fn().mockResolvedValue({ message: 'Logged out successfully' }),
  };

  const mockPrismaService = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    systemLog: { create: jest.fn().mockResolvedValue({ id: '1' }) },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/login returns tokens', async () => {
    const response = await app
      .getHttpAdapter()
      .getInstance()
      .inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'admin@school.com', password: 'Admin123!' },
      });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.accessToken).toBe('mock-access');
    expect(mockAuthService.login).toHaveBeenCalled();
  });

  it('GET /api/v1/users/me without token returns 401', async () => {
    const response = await app
      .getHttpAdapter()
      .getInstance()
      .inject({ method: 'GET', url: '/api/v1/users/me' });

    expect(response.statusCode).toBe(401);
  });
});
