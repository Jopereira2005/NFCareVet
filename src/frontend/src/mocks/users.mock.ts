import { UserRole } from '@nfcarevet/common';

import profileAvatar from '@/assets/images/profile-avatar.jpg';
import type { CurrentUser } from '@/interfaces/session.types';

export const CURRENT_USER_MOCK: CurrentUser = {
  id: 'user-camila',
  name: 'Dra. Camila Andrade',
  email: 'camila.andrade@nfcarevet.com',
  role: UserRole.ADMIN,
  avatarUrl: profileAvatar,
};

export const VET_MOCK = { id: 'user-paxe', name: 'Dr. Mr Paxe', role: UserRole.VET };

export const NURSE_MOCK = { id: 'user-lucas', name: 'Lucas da Silva', role: UserRole.VET };
