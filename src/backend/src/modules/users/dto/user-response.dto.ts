import { UserRole } from '@prisma/client';

export class UserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  role!: UserRole;
  badgeUid?: string | null;
  active!: boolean;
  createdAt!: Date;
}
