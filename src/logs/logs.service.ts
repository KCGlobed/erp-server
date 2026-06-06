import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LogsQueryDto } from './dto/logs-query.dto';
import { paginate, paginatedMeta } from '../common/dto/pagination-query.dto';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: LogsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.SystemLogWhereInput = {};
    if (query.level) {
      where.level = query.level;
    }
    if (query.context) {
      where.context = { contains: query.context, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return { data, meta: paginatedMeta(total, page, limit) };
  }
}
