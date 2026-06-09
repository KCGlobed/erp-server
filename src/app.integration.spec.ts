import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

/**
 * INTEGRATION TESTS for AppModule
 *
 * Verifies the full NestJS module composition:
 * - All providers are resolvable
 * - Global modules (PrismaModule, ConfigModule) are wired correctly
 * - Controllers and services are injected properly
 *
 * PrismaService is mocked to prevent real DB connection.
 */
describe('AppModule (Integration)', () => {
  let module: TestingModule;

  const mockPrismaService = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn().mockResolvedValue([]),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    cleanDatabase: jest.fn().mockResolvedValue(undefined),
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    student: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    teacher: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    parent: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    staff: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    class: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    subject: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    academicYear: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    exam: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    examResult: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    feeStructure: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    feePayment: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    refreshToken: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    book: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    leave: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    timetable: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    classSubject: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();
  });

  afterAll(async () => {
    await module.close();
  });

  // ─── Module composition ───────────────────────────────────────────────────

  it('should compile the AppModule successfully', () => {
    expect(module).toBeDefined();
  });

  it('should resolve AppController', () => {
    const controller = module.get<AppController>(AppController);
    expect(controller).toBeDefined();
  });

  it('should resolve AppService', () => {
    const service = module.get<AppService>(AppService);
    expect(service).toBeDefined();
  });

  it('should resolve PrismaService from global PrismaModule', () => {
    const prisma = module.get<PrismaService>(PrismaService);
    expect(prisma).toBeDefined();
  });

  // ─── AppService behaviour ─────────────────────────────────────────────────

  it('AppService.getHello() should return "Hello World!"', () => {
    const service = module.get<AppService>(AppService);
    expect(service.getHello()).toBe('Hello World!');
  });

  // ─── AppController behaviour ──────────────────────────────────────────────

  it('AppController.getHello() should delegate to AppService', () => {
    const controller = module.get<AppController>(AppController);
    expect(controller.getHello()).toBe('Hello World!');
  });

  // ─── Global PrismaService singleton ──────────────────────────────────────

  it('PrismaService should be the same singleton instance globally', () => {
    const p1 = module.get<PrismaService>(PrismaService);
    const p2 = module.get<PrismaService>(PrismaService);
    expect(p1).toBe(p2);
  });
});
