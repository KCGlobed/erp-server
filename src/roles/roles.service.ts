import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const PROTECTED_ROLE = 'SUPER_ADMIN';

const roleWithPermissionsInclude = {
  permissions: { include: { permission: true } },
  users: { select: { userId: true } },
};

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const name = dto.name.toUpperCase();
    const existing = await this.prisma.role.findUnique({ where: { name } });
    if (existing) throw new ConflictException('Role already exists');
    return this.prisma.role.create({
      data: { name, description: dto.description },
      include: roleWithPermissionsInclude,
    });
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: roleWithPermissionsInclude,
      orderBy: { name: 'asc' },
    });
    return roles.map(this.mapRole);
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: roleWithPermissionsInclude,
    });
    if (!role) throw new NotFoundException('Role not found');
    return this.mapRole(role);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (
      role.name === PROTECTED_ROLE &&
      dto.name &&
      dto.name.toUpperCase() !== PROTECTED_ROLE
    ) {
      throw new ForbiddenException('Cannot rename the SUPER_ADMIN role');
    }
    const data: any = {};
    if (dto.name) data.name = dto.name.toUpperCase();
    if (dto.description !== undefined) data.description = dto.description;
    return this.prisma.role.update({
      where: { id },
      data,
      include: roleWithPermissionsInclude,
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.name === PROTECTED_ROLE) {
      throw new ForbiddenException('Cannot delete the SUPER_ADMIN role');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.userRole.deleteMany({ where: { roleId: id } });
      const deleted = await tx.role.delete({ where: { id } });
      return { message: 'Role deleted', id: deleted.id };
    });
  }

  async syncPermissions(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
          skipDuplicates: true,
        });
      }
      return tx.role.findUnique({
        where: { id: roleId },
        include: roleWithPermissionsInclude,
      });
    });
  }

  async assignPermission(roleId: string, permissionId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) throw new NotFoundException('Permission not found');
    await this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      create: { roleId, permissionId },
      update: {},
    });
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: roleWithPermissionsInclude,
    });
  }

  async removePermission(roleId: string, permissionId: string) {
    const link = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (!link)
      throw new NotFoundException('Permission not assigned to this role');
    await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: roleWithPermissionsInclude,
    });
  }

  private mapRole(role: any) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      usersCount: role.users?.length ?? 0,
      permissions: role.permissions.map((rp: any) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
    };
  }
}
