import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Health & Diagnóstico')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Rota Pública de Health Check da API e Banco de Dados
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Health Check da API e Banco de Dados',
    description:
      'Retorna o status operacional da API e a conectividade com o banco de dados relacional PostgreSQL.',
  })
  @ApiOkResponse({
    description: 'Serviço operacional.',
    schema: {
      example: {
        status: 'ok',
        service: 'NFCareVet API',
        version: '1.0.0',
        timestamp: '2026-03-01T10:00:00.000Z',
        uptimeSeconds: 3600,
        database: 'up',
      },
    },
  })
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
  @ApiBearerAuth('JWT-auth')
  @Get('auth-test')
  @ApiOperation({
    summary: 'Teste de autenticação JWT',
    description: 'Verifica se o token JWT fornecido no header Authorization é válido.',
  })
  @ApiOkResponse({
    description: 'Token válido e usuário autenticado.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou não fornecido.',
  })
  testAuth(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Autenticação JWT validada com sucesso!',
      authenticatedUser: user,
      timestamp: new Date().toISOString(),
    };
  }

  // 3. Rota Protegida de Teste RBAC (ADMIN ou VET)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @Get('vet-test')
  @ApiOperation({
    summary: 'Teste de permissão clínica (VET ou ADMIN)',
    description: 'Valida se o usuário autenticado possui perfil de veterinário ou administrador.',
  })
  @ApiOkResponse({
    description: 'Permissão médica confirmada.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado: o perfil do usuário não tem privilégios clínicos.',
  })
  testVetRole(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Permissão médica (VET/ADMIN) validada com sucesso!',
      userRole: user.role,
      userId: user.userId,
    };
  }

  // 4. Rota Protegida de Teste RBAC (Exclusiva para ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Get('admin-test')
  @ApiOperation({
    summary: 'Teste de permissão administrativa (ADMIN)',
    description: 'Valida se o usuário autenticado possui perfil de administrador exclusivo.',
  })
  @ApiOkResponse({
    description: 'Permissão administrativa confirmada.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado: restrito a administradores.',
  })
  testAdminRole(@CurrentUser('userId') userId: string) {
    return {
      message: 'Permissão administrativa (ADMIN) validada com sucesso!',
      adminUserId: userId,
    };
  }
}

