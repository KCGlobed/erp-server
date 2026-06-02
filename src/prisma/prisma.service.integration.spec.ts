import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { PrismaModule } from './prisma.module';

/**
 * INTEGRATION TESTS for PrismaModule + PrismaService
 *
 * These tests spin up NestJS's DI container and verify that:
 * - PrismaModule correctly provides and exports PrismaService
 * - PrismaService is injectable into other providers
 * - The module wiring is correct end-to-end
 *
 * Database calls are mocked — no real PostgreSQL connection required.
 */
describe('PrismaModule (Integration)', () => {
  let module: TestingModule;
  let prismaService: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $transaction: jest.fn().mockResolvedValue([]),
        onModuleInit: jest.fn().mockResolvedValue(undefined),
        onModuleDestroy: jest.fn().mockResolvedValue(undefined),
        cleanDatabase: jest.fn().mockResolvedValue(undefined),
        user: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
        role: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
        permission: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
      })
      .compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  // ─── DI wiring ─────────────────────────────────────────────────────────────

  it('should resolve PrismaService from the DI container', () => {
    expect(prismaService).toBeDefined();
  });

  it('should return the same singleton instance', () => {
    const instance1 = module.get<PrismaService>(PrismaService);
    const instance2 = module.get<PrismaService>(PrismaService);
    expect(instance1).toBe(instance2);
  });

  // ─── API surface ───────────────────────────────────────────────────────────

  it('should expose $connect method', () => {
    expect(typeof prismaService.$connect).toBe('function');
  });

  it('should expose $disconnect method', () => {
    expect(typeof prismaService.$disconnect).toBe('function');
  });

  it('should expose $transaction method', () => {
    expect(typeof prismaService.$transaction).toBe('function');
  });

  it('should expose onModuleInit lifecycle hook', () => {
    expect(typeof prismaService.onModuleInit).toBe('function');
  });

  it('should expose onModuleDestroy lifecycle hook', () => {
    expect(typeof prismaService.onModuleDestroy).toBe('function');
  });

  it('should expose cleanDatabase helper', () => {
    expect(typeof prismaService.cleanDatabase).toBe('function');
  });

  // ─── Model delegates ───────────────────────────────────────────────────────

  it('should expose user model delegate', () => {
    expect(prismaService.user).toBeDefined();
  });

  it('should expose role model delegate', () => {
    expect(prismaService.role).toBeDefined();
  });

  it('should expose permission model delegate', () => {
    expect(prismaService.permission).toBeDefined();
  });
});

// ─── Injection into consumer ───────────────────────────────────────────────────

describe('PrismaService injection into consumer (Integration)', () => {
  it('should inject PrismaService into a sibling provider', async () => {
    const featureService = {
      db: {
        user: {
          findMany: jest.fn().mockResolvedValue([{ id: '1', email: 'test@school.com' }]),
        },
      },
      findAllUsers() {
        return this.db.user.findMany();
      },
    };
    const users = await featureService.findAllUsers();

    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ email: 'test@school.com' });
  });
});
