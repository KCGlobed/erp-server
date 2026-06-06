import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { LogsQueryDto } from './dto/logs-query.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';

@ApiTags('System Logs')
@ApiBearerAuth()
@RequirePermissions(PERMISSION_NAMES.READ_LOGS)
@Controller({ path: 'logs', version: '1' })
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({ summary: 'List system logs (admin, filterable)' })
  findAll(@Query() query: LogsQueryDto) {
    return this.logsService.findAll(query);
  }
}
