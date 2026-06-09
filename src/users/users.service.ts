import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  mapUserResponse,
  userWithRolesInclude,
} from '../common/utils/user-mapper.util';
import { paginate, paginatedMeta } from '../common/dto/pagination-query.dto';
import { AuthUser } from '../common/types/auth-user.type';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number, currentUser: AuthUser) {
    const isAdmin =
      currentUser.roles.includes('SUPER_ADMIN') ||
      currentUser.roles.includes('ADMIN') ||
      currentUser.permissions.includes(PERMISSION_NAMES.MANAGE_USERS);

    const isFaculty = currentUser.roles.includes('FACULTY');

    let whereClause: any = {};

    if (!isAdmin) {
      if (isFaculty) {
        // Faculty can only view students in their assigned cohorts and courses
        const [assignedCohorts, assignedCourses] = await Promise.all([
          this.prisma.facultyCohortAssignment.findMany({
            where: { userId: currentUser.id },
            select: { cohortId: true },
          }),
          this.prisma.facultyCourseAssignment.findMany({
            where: { userId: currentUser.id },
            select: { courseId: true },
          }),
        ]);

        const cohortIds = assignedCohorts.map((ac) => ac.cohortId);
        const courseIds = assignedCourses.map((ac) => ac.courseId);

        whereClause = {
          roles: {
            some: {
              role: {
                name: 'STUDENT',
              },
            },
          },
          cohortId: { in: cohortIds },
          enrollments: {
            some: {
              courseId: { in: courseIds },
            },
          },
        };
      } else {
        throw new ForbiddenException(
          'You do not have permission to view users',
        );
      }
    }

    const { skip, take } = paginate(page, limit);
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        skip,
        take,
        include: userWithRolesInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return {
      data: users.map(mapUserResponse),
      meta: paginatedMeta(total, page, limit),
    };
  }

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userWithRolesInclude,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return mapUserResponse(user);
  }

  async findById(id: string, currentUser: AuthUser) {
    this.assertCanAccessUser(id, currentUser);
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: userWithRolesInclude,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return mapUserResponse(user);
  }

  async update(id: string, dto: UpdateUserDto, currentUser: AuthUser) {
    this.assertCanModifyUser(id, currentUser);
    const { role, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (role) {
        const targetRole = await tx.role.findUnique({ where: { name: role } });
        if (!targetRole) throw new NotFoundException(`Role ${role} not found`);
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.create({
          data: { userId: id, roleId: targetRole.id },
        });
      }
      const user = await tx.user.update({
        where: { id },
        data: rest,
        include: userWithRolesInclude,
      });
      return mapUserResponse(user);
    });
  }

  async assignRole(userId: string, roleId: string) {
    await this.ensureUserExists(userId);
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {},
    });
    return this.findById(userId, {
      id: userId,
      permissions: [PERMISSION_NAMES.MANAGE_USERS],
    } as AuthUser);
  }

  async removeRole(userId: string, roleId: string) {
    await this.ensureUserExists(userId);
    const link = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (!link) throw new NotFoundException('User does not have this role');
    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
    return { message: 'Role removed from user' };
  }

  async remove(id: string, currentUser: AuthUser) {
    this.assertCanModifyUser(id, currentUser);
    if (id === currentUser.id)
      throw new ForbiddenException('Cannot delete yourself');
    await this.ensureUserExists(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userPermission.deleteMany({ where: { userId: id } });
      await tx.systemLog.updateMany({
        where: { userId: id },
        data: { userId: null },
      });
      await tx.refreshToken.deleteMany({ where: { userId: id } });
      const deleted = await tx.user.delete({ where: { id } });
      return { message: 'User deleted successfully', id: deleted.id };
    });
  }

  // --- Direct User Permissions ---

  async getUserDirectPermissions(userId: string) {
    await this.ensureUserExists(userId);
    const grants = await this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
      orderBy: { grantedAt: 'desc' },
    });
    return grants.map((g) => ({
      id: g.permission.id,
      name: g.permission.name,
      description: g.permission.description,
      grantedAt: g.grantedAt,
      grantedBy: g.grantedBy,
    }));
  }

  async grantUserPermission(
    userId: string,
    permissionId: string,
    grantedBy: string,
  ) {
    await this.ensureUserExists(userId);
    const perm = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!perm) throw new NotFoundException('Permission not found');
    const existing = await this.prisma.userPermission.findUnique({
      where: { userId_permissionId: { userId, permissionId } },
    });
    if (existing)
      throw new ConflictException('User already has this permission directly');
    await this.prisma.userPermission.create({
      data: { userId, permissionId, grantedBy },
    });
    return { message: 'Permission granted', permissionId };
  }

  async revokeUserPermission(userId: string, permissionId: string) {
    await this.ensureUserExists(userId);
    const link = await this.prisma.userPermission.findUnique({
      where: { userId_permissionId: { userId, permissionId } },
    });
    if (!link)
      throw new NotFoundException('User does not have this direct permission');
    await this.prisma.userPermission.delete({
      where: { userId_permissionId: { userId, permissionId } },
    });
    return { message: 'Permission revoked', permissionId };
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
  }

  private assertCanAccessUser(targetId: string, currentUser: AuthUser) {
    const isSelf = currentUser.id === targetId;
    const canManage = currentUser.permissions.includes(
      PERMISSION_NAMES.MANAGE_USERS,
    );
    if (!canManage && !isSelf)
      throw new ForbiddenException('Cannot access this user');
  }

  private assertCanModifyUser(targetId: string, currentUser: AuthUser) {
    const isSelf = currentUser.id === targetId;
    const canManage = currentUser.permissions.includes(
      PERMISSION_NAMES.MANAGE_USERS,
    );
    if (!canManage && !isSelf)
      throw new ForbiddenException('Cannot update this user');
  }
}
