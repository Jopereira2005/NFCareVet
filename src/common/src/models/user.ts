import { UserRole } from '../enums/index.js';

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeUid?: string | null;
  active: boolean;
  createdAt: Date | string;
}

export interface IUserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface ICreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  badgeUid?: string;
  active?: boolean;
}

export interface IUpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  badgeUid?: string;
  active?: boolean;
}
