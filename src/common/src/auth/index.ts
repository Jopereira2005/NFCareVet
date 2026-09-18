import { UserRole } from '../enums/index.js';
import { IUserSummary } from '../models/user.js';

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IBadgeLoginPayload {
  badgeUid: string;
}

export interface IAuthUser extends IUserSummary {
  badgeUid?: string | null;
}

export interface IAuthResponse {
  accessToken: string;
  user: IAuthUser;
}

export interface IJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
