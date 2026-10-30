import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RegistrationsService } from './registrations.service';
import { RecentRegistrationsQueryDto } from './dto/recent-registrations-query.dto';
import {
  RecentRegistrationResponse,
  RecentRegistrationResponseDto,
} from './dto/recent-registration-response.dto';

@ApiTags('Dashboard & Cadastros Recentes (Registrations)')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @Get('recent')
  @ApiOperation({
    summary: 'Listar últimos pacientes e tutores cadastrados',
    description:
      'Retorna uma lista unificada dos últimos pacientes ({ kind: "patient", patient }) e tutores ({ kind: "guardian", guardian }) cadastrados no sistema, ordenados por createdAt decrescente.',
  })
  @ApiOkResponse({
    description: 'Lista unificada de cadastros recentes ordenada do mais novo para o mais antigo.',
    type: [RecentRegistrationResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  @ApiForbiddenResponse({ description: 'Acesso negado.' })
  async listRecent(
    @Query() query: RecentRegistrationsQueryDto,
  ): Promise<RecentRegistrationResponse[]> {
    return this.service.listRecent(query.limit ?? 3);
  }
}
