import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { AuthUser } from '../common/types/auth-user.type';

@Injectable()
export class ExperienceService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateExperienceDto, currentUser: AuthUser) {
    // Guard: if the user is marked as fresher, block adding experience
    await this.assertNotFresher(currentUser.id);

    return this.prisma.experience.create({
      data: {
        ...dto,
        fromDate: new Date(dto.fromDate),
        toDate: dto.toDate ? new Date(dto.toDate) : undefined,
        userId: currentUser.id,
      },
    });
  }

  // ── Get my experiences ────────────────────────────────────────────────────

  async findMine(currentUser: AuthUser) {
    return this.prisma.experience.findMany({
      where: { userId: currentUser.id },
      orderBy: { fromDate: 'desc' },
    });
  }

  // ── Get experiences of any user (admin) ───────────────────────────────────

  async findByUser(userId: string) {
    // Caller must be admin — enforced in controller via guard
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.experience.findMany({
      where: { userId },
      orderBy: { fromDate: 'desc' },
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateExperienceDto, currentUser: AuthUser) {
    const entry = await this.findOwnedEntry(id, currentUser);

    return this.prisma.experience.update({
      where: { id: entry.id },
      data: {
        ...dto,
        fromDate: dto.fromDate ? new Date(dto.fromDate) : undefined,
        toDate: dto.toDate ? new Date(dto.toDate) : undefined,
      },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(id: string, currentUser: AuthUser) {
    const entry = await this.findOwnedEntry(id, currentUser);
    await this.prisma.experience.delete({ where: { id: entry.id } });
    return { message: 'Experience entry deleted' };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Returns the experience entry only if it belongs to the calling user
   * OR the caller is an admin / super-admin.
   */
  private async findOwnedEntry(id: string, currentUser: AuthUser) {
    const entry = await this.prisma.experience.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Experience entry not found');

    const isAdmin =
      currentUser.roles?.includes('ADMIN') ||
      currentUser.roles?.includes('SUPER_ADMIN');

    if (entry.userId !== currentUser.id && !isAdmin) {
      throw new ForbiddenException('You can only modify your own experience');
    }

    return entry;
  }

  /**
   * Throws 400 if the user's faculty profile OR student profile has
   * isFresher = true — you cannot add experience when you're a fresher.
   */
  private async assertNotFresher(userId: string) {
    const [faculty, student] = await Promise.all([
      this.prisma.facultyProfile.findUnique({
        where: { userId },
        select: { isFresher: true },
      }),
      this.prisma.studentProfile.findUnique({
        where: { userId },
        select: { isFresher: true },
      }),
    ]);

    if (faculty?.isFresher || student?.isFresher) {
      throw new BadRequestException(
        'Cannot add experience when marked as fresher. ' +
          'Update your profile and set isFresher=false first.',
      );
    }
  }
}
