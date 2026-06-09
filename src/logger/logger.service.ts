import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogLevel } from '@prisma/client';

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    message: string,
    context = 'Application',
    userId?: string,
    metadata?: any,
  ) {
    this.logger.log(`[${context}] ${message}`);
    await this.saveLog(LogLevel.INFO, message, context, userId, metadata);
  }

  async warn(
    message: string,
    context = 'Application',
    userId?: string,
    metadata?: any,
  ) {
    this.logger.warn(`[${context}] ${message}`);
    await this.saveLog(LogLevel.WARN, message, context, userId, metadata);
  }

  async error(
    message: string,
    stackOrContext = 'Application',
    userId?: string,
    metadata?: any,
  ) {
    this.logger.error(`[${stackOrContext}] ${message}`);
    await this.saveLog(LogLevel.ERROR, message, stackOrContext, userId, {
      ...metadata,
      stack: metadata?.stack || null,
    });
  }

  async success(
    message: string,
    context = 'Application',
    userId?: string,
    metadata?: any,
  ) {
    this.logger.log(`✨ [${context}] [SUCCESS] ${message}`);
    // Persist as INFO with SUCCESS metadata or custom tag since DB LogLevel has no success type
    await this.saveLog(LogLevel.INFO, message, context, userId, {
      ...metadata,
      success: true,
    });
  }

  private async saveLog(
    level: LogLevel,
    message: string,
    context: string,
    userId?: string,
    metadata?: any,
  ) {
    try {
      await this.prisma.systemLog.create({
        data: {
          level,
          message,
          context,
          userId: userId || null,
          method: metadata?.method || null,
          url: metadata?.url || null,
          statusCode: metadata?.statusCode || null,
          duration: metadata?.duration || null,
          ipAddress: metadata?.ipAddress || metadata?.ip || null,
          userAgent: metadata?.userAgent || null,
          stack: metadata?.stack || null,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      });
    } catch (err) {
      console.error('Failed to write system log to database:', err);
    }
  }
}
