import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HospitalizationsService } from './hospitalizations.service';
import { ClinicalEventsQueryDto } from './dto/clinical-events-query.dto';
import { UpdateClinicalEventDto } from './dto/update-clinical-event.dto';
import { TimelineEventItemDto } from './dto/timeline-response.dto';

@ApiTags('Internações (Hospitalizations)')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
@Controller('clinical-events')
export class ClinicalEventsController {
  constructor(private readonly service: HospitalizationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar eventos clínicos recentes por executor (Suas Atividades)',
    description:
      'Retorna os eventos clínicos registrados pelo profissional logado (@CurrentUser) quando executor=me (ou pelo UUID do usuário especificado), ordenados do mais recente para o mais antigo.',
  })
  @ApiOkResponse({
    description: 'Lista de eventos clínicos recentes com dados do executor, prescritor e paciente.',
    type: [TimelineEventItemDto],
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  @ApiForbiddenResponse({ description: 'Acesso negado.' })
  async listByExecutor(
    @CurrentUser('userId') currentUserId: string,
    @Query() query: ClinicalEventsQueryDto,
  ): Promise<TimelineEventItemDto[]> {
    return this.service.listClinicalEventsByExecutor(currentUserId, query);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @ApiOperation({
    summary: 'Editar / corrigir um evento clínico registrado',
    description:
      'Permite corrigir título, observações (description), métricas de sinais vitais (metrics) e data/horário (recordedAt) de um evento clínico já registrado.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do evento clínico',
    example: 'uuid-event-1',
  })
  @ApiOkResponse({
    description: 'Evento clínico atualizado com sucesso.',
    type: TimelineEventItemDto,
  })
  @ApiBadRequestResponse({ description: 'Dados de entrada inválidos.' })
  @ApiNotFoundResponse({ description: 'Evento clínico não encontrado.' })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a VET e ADMIN.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClinicalEventDto,
  ): Promise<TimelineEventItemDto> {
    return this.service.updateClinicalEvent(id, dto);
  }
}
