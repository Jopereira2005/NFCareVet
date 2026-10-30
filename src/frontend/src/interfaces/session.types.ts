import type { IAuthUser } from '@nfcarevet/common';

export interface CurrentUser extends IAuthUser {
  /** Pending API */
  avatarUrl?: string | null;
}
