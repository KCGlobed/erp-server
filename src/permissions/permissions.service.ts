import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';

const SYSTEM_PERMISSIONS = Object.values(PERMISSION_NAMES);

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto) {
    const name = dto.name.toUpperCase().replace(/\s+/g, '_');
    const existing = await this.prisma.permission.findUnique({ where: { name } });
    if (existing) throw new ConflictException('Permission already exists');
    return this.prisma.permission.create({
      data: { name, description: dto.description },
    });
  }

  async findAll() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
      include: {
        roles: { include: { role: { select: { id: true, name: true } } } },
        users: { select: { userId: true } },
      },
    });
    return permissions.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      rolesCount: p.roles.length,
      roles: p.roles.map((rp) => ({ id: rp.role.id, name: rp.role.name })),
      usersCount: p.users.length,
      isSystem: SYSTEM_PERMISSIONS.includes(p.name as any),
    }));
  }

  async update(id: string, dto: UpdatePermissionDto) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException('Permission not found');
    if (SYSTEM_PERMISSIONS.includes(perm.name as any)) {
      throw new ForbiddenException('Cannot modify a system permission');
    }
    const data: any = {};
    if (dto.name) data.name = dto.name.toUpperCase().replace(/\s+/g, '_');
    if (dto.description !== undefined) data.description = dto.description;
    if (data.name) {
      const conflict = await this.prisma.permission.findUnique({ where: { name: data.name } });
      if (conflict && conflict.id !== id) throw new ConflictException('Permission name already taken');
    }
    return this.prisma.permission.update({ where: { id }, data });
  }

  async remove(id: string) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException('Permission not found');
    if (SYSTEM_PERMISSIONS.includes(perm.name as any)) {
      throw new ForbiddenException('Cannot delete a system permission');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { permissionId: id } });
      await tx.userPermission.deleteMany({ where: { permissionId: id } });
      const deleted = await tx.permission.delete({ where: { id } });
      return { message: 'Permission deleted', id: deleted.id };
    });
  }
}
