import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ExperienceService } from './experience.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/types/auth-user.type';

@ApiTags('Experience')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'experience', version: '1' })
export class ExperienceController {
  constructor(private readonly service: ExperienceService) {}

  // ── Create ────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Add an experience entry for the currently logged-in user',
    description:
      'Blocked if the user has isFresher=true on their profile. ' +
      'Use POST /faculty-profile/me or /student-profile/me to toggle isFresher first.',
  })
  create(@Body() dto: CreateExperienceDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  // ── Get my experiences ────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get all experience entries for the current user' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.service.findMine(user);
  }

  // ── Get any user's experiences (admin) ───────────────────────────────────

  @Get('user/:userId')
  @ApiOperation({
    summary: "Get a user's experience entries (Admin/Super Admin only)",
  })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update an experience entry (owner or admin)' })
  @ApiParam({ name: 'id', description: 'Experience entry ID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExperienceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an experience entry (owner or admin)' })
  @ApiParam({ name: 'id', description: 'Experience entry ID' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user);
  }
}
