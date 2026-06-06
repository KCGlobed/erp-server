import { ApiPropertyOptional } from '@nestjs/swagger';
import { LogLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class LogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LogLevel })
  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @ApiPropertyOptional({ example: 'HTTP-Request' })
  @IsOptional()
  @IsString()
  context?: string;
}
