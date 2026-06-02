import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connected successfully');

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error — Prisma event typing
      this.$on('query', (event: { query: string; duration: number }) => {
        if (event.duration > 200) {
          this.logger.warn(`Slow query (${event.duration}ms): ${event.query}`);
        }
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Cleans the database for testing purposes.
   * Only runs in test environment.
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase() can only be called in test environment');
    }

    // Delete in dependency order (children before parents)
    await this.$transaction([
      this.systemLog.deleteMany(),
      this.refreshToken.deleteMany(),
      this.userRole.deleteMany(),
      this.rolePermission.deleteMany(),
      this.permission.deleteMany(),
      this.role.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
