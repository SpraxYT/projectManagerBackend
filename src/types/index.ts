// Types généraux pour l'application

import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  customRoleId?: string | null;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  customRoleId?: string | null;
  customRole?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  // Users
  canViewUsers?: boolean;
  canCreateUsers?: boolean;
  canEditUsers?: boolean;
  canDeleteUsers?: boolean;
  
  // Roles
  canViewRoles?: boolean;
  canCreateRoles?: boolean;
  canEditRoles?: boolean;
  canDeleteRoles?: boolean;
  
  // Activity Logs
  canViewLogs?: boolean;
  
  // Projects (Phase 2)
  canViewAllProjects?: boolean;
  canCreateProjects?: boolean;
  canEditProjects?: boolean;
  canDeleteProjects?: boolean;
  canManageProjectMembers?: boolean;
  canViewProjectCredentials?: boolean;
  
  // Tasks (Phase 3)
  canViewAllTasks?: boolean;
  canCreateTasks?: boolean;
  canEditAllTasks?: boolean;
  canDeleteAllTasks?: boolean;
  canAssignTasks?: boolean;
}

export const DEFAULT_PERMISSIONS: Record<UserRole, Permission> = {
  OWNER: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewRoles: true,
    canCreateRoles: true,
    canEditRoles: true,
    canDeleteRoles: true,
    canViewLogs: true,
    canViewAllProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canManageProjectMembers: true,
    canViewProjectCredentials: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canEditAllTasks: true,
    canDeleteAllTasks: true,
    canAssignTasks: true,
  },
  ADMIN: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,
    canViewRoles: true,
    canCreateRoles: true,
    canEditRoles: true,
    canDeleteRoles: false,
    canViewLogs: true,
    canViewAllProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: false,
    canManageProjectMembers: true,
    canViewProjectCredentials: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canEditAllTasks: true,
    canDeleteAllTasks: false,
    canAssignTasks: true,
  },
  MANAGER: {
    canViewUsers: true,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewRoles: true,
    canCreateRoles: false,
    canEditRoles: false,
    canDeleteRoles: false,
    canViewLogs: false,
    canViewAllProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: false,
    canManageProjectMembers: true,
    canViewProjectCredentials: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canEditAllTasks: true,
    canDeleteAllTasks: false,
    canAssignTasks: true,
  },
  MEMBER: {
    canViewUsers: true,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewRoles: true,
    canCreateRoles: false,
    canEditRoles: false,
    canDeleteRoles: false,
    canViewLogs: false,
    canViewAllProjects: false,
    canCreateProjects: true,
    canEditProjects: false,
    canDeleteProjects: false,
    canManageProjectMembers: false,
    canViewProjectCredentials: false,
    canViewAllTasks: false,
    canCreateTasks: true,
    canEditAllTasks: false,
    canDeleteAllTasks: false,
    canAssignTasks: false,
  },
  CUSTOM: {
    // Les permissions custom seront chargées depuis CustomRole
  },
};
