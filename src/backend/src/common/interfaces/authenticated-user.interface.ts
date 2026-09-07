import { UserRole } from '@prisma/client';

export class AuthenticatedUser {
  userId!: string;
  email!: string;
  role!: UserRole;
}
