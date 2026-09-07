import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();

    if (!user || !user.role) {
      throw new ForbiddenException(
        'Acesso negado: informações de usuário ou papel indisponíveis.',
      );
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado: seu papel (${user.role}) não possui permissão para acessar este recurso.`,
      );
    }

    return true;
  }
}
