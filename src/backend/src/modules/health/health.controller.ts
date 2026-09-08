import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Rota Pública de Health Check da API e Banco de Dados
  @Public()
  @Get()
  async getHealth() {
    let dbStatus = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    return {
      status: dbStatus === 'up' ? 'ok' : 'degraded',
      service: 'NFCareVet API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
    };
  }

  // 2. Rota Protegida de Teste de Autenticação (Qualquer usuário logado: ADMIN, VET, REC)
  @Get('auth-test')
  testAuth(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Autenticação JWT validada com sucesso!',
      authenticatedUser: user,
      timestamp: new Date().toISOString(),
    };
  }

  // 3. Rota Protegida de Teste RBAC (ADMIN ou VET)
  @Roles(UserRole.ADMIN, UserRole.VET)
  @Get('vet-test')
  testVetRole(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Permissão médica (VET/ADMIN) validada com sucesso!',
      userRole: user.role,
      userId: user.userId,
    };
  }

  // 4. Rota Protegida de Teste RBAC (Exclusiva para ADMIN)
  @Roles(UserRole.ADMIN)
  @Get('admin-test')
  testAdminRole(@CurrentUser('userId') userId: string) {
    return {
      message: 'Permissão administrativa (ADMIN) validada com sucesso!',
      adminUserId: userId,
    };
  }
}
