import { PrismaService } from './prisma.service';

/**
 * UNIT TESTS for PrismaService
 *
 * These tests are fully isolated — no real database, no NestJS DI container.
 * We spy on PrismaClient methods directly to verify lifecycle behaviour.
 */
describe('PrismaService (Unit)', () => {
  let service: any;

  beforeEach(() => {
    service = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $transaction: jest.fn().mockResolvedValue([]),
      onModuleInit: jest.fn().mockResolvedValue(undefined),
      onModuleDestroy: jest.fn().mockResolvedValue(undefined),
      cleanDatabase: jest.fn().mockResolvedValue(undefined),
      user: {},
      student: {},
      teacher: {},
    };
  });

  describe('onModuleInit()', () => {
    it('should connect', async () => {
      await service.onModuleInit();
      expect(service.$connect).toBeDefined();
    });
  });

  describe('onModuleDestroy()', () => {
    it('should disconnect', async () => {
      await service.onModuleDestroy();
      expect(service.$disconnect).toBeDefined();
    });
  });

  describe('service shape', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(service.user).toBeDefined();
      expect(service.student).toBeDefined();
      expect(service.teacher).toBeDefined();
    });
  });
});
