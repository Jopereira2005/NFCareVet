import { UserRole } from '@prisma/client';

export class AuthUserDto {
  id!: string;
  name!: string;
  email!: string;
  role!: UserRole;
  badgeUid?: string | null;
}

export class AuthResponseDto {
  accessToken!: string;
  user!: AuthUserDto;
}
