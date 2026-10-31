import { UserRole } from '../enums/index.js';

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeUid?: string | null;
  avatarUrl?: string | null;
  active: boolean;
  createdAt: Date | string;
}

export interface IUserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface ICreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  badgeUid?: string;
  avatarUrl?: string;
  active?: boolean;
}

export interface IUpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  badgeUid?: string;
  avatarUrl?: string | null;
  active?: boolean;
}
