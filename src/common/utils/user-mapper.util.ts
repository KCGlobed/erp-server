import { User, Role, Permission, UserRole, RolePermission, UserPermission } from '@prisma/client';

export type UserWithRoles = User & {
  roles: (UserRole & {
    role: Role & { permissions: (RolePermission & { permission: Permission })[] };
  })[];
  directPermissions?: (UserPermission & { permission: Permission })[];
};

export function extractRolesAndPermissions(user: UserWithRoles) {
  const roles = user.roles.map((ur) => ur.role.name);
  const rolePerms = user.roles.flatMap((ur) =>
    ur.role.permissions.map((rp) => rp.permission.name),
  );
  const directPerms = user.directPermissions
    ? user.directPermissions.map((dp) => dp.permission.name)
    : [];
  
  const permissions = [...new Set([...rolePerms, ...directPerms])];
  return { roles, permissions };
}

export function mapUserResponse(user: UserWithRoles) {
  const { roles, permissions } = extractRolesAndPermissions(user);
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    roles,
    permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const userWithRolesInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
  directPermissions: {
    include: {
      permission: true,
    },
  },
} as const;
