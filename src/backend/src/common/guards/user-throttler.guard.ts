import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    const userId = req.user?.id ?? req.user?.sub;
    const ip = req.ips?.length ? req.ips[0] : req.ip;
    return userId ? `user:${userId}` : `ip:${ip ?? 'unknown'}`;
  }

  protected override async throwThrottlingException(
    _context: ExecutionContext,
  ): Promise<void> {
    throw new ThrottlerException(
      'Limite de solicitações de upload excedido (máximo de 5 por minuto). Aguarde um instante antes de tentar novamente.',
    );
  }
}
