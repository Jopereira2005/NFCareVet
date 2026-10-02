import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { CancelPrescriptionItemDto } from './dto/cancel-prescription-item.dto';
import { DeactivatePrescriptionDto } from './dto/deactivate-prescription.dto';
import { PendingScheduleQueryDto } from './dto/pending-schedule-query.dto';
import {
  PrescriptionResponseDto,
  CancelItemResponseDto,
  DeactivatePrescriptionResponseDto,
  PendingScheduleItemResponseDto,
} from './dto/prescription-response.dto';

@ApiTags('Prescrições Médicas e Aprazamento (Prescriptions)')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
@Controller()
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('hospitalizations/:id/prescriptions')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar Prescrição Médica e Aprazamento',
    description:
      'Cria um novo protocolo de prescrição contendo uma lista de itens aprazados (medicamentos, procedimentos, checagem de sinais vitais ou exames) para uma internação ativa.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da internação ativa',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiCreatedResponse({
    description: 'Prescrição criada com sucesso e itens aprazados.',
    type: PrescriptionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Internação não está ativa, baia inativa ou itens inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Internação ou médico veterinário não encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  @ApiForbiddenResponse({
    description: 'Apenas Médicos Veterinários (VET) ou Administradores (ADMIN) podem prescrever.',
  })
  async create(
    @Param('id') hospitalizationId: string,
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.create(hospitalizationId, currentUserId, dto);
  }

  @Get('hospitalizations/:id/prescriptions/active')
  @ApiOperation({
    summary: 'Consultar Prescrição Médica Ativa',
    description:
      'Retorna a prescrição médica em vigor para a internação especificada, com todos os seus itens aprazados ordenados cronologicamente.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da internação ativa',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiOkResponse({
    description: 'Prescrição ativa encontrada com sucesso.',
    type: PrescriptionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Internação não encontrada ou nenhuma prescrição ativa em vigor.',
  })
  async findActiveByHospitalization(
    @Param('id') hospitalizationId: string,
  ): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.findActiveByHospitalization(hospitalizationId);
  }

  @Get('prescriptions/schedule/pending')
  @ApiOperation({
    summary: 'Fila de Aprazamento da Enfermaria',
    description:
      'Lista os medicamentos, procedimentos e checagens pendentes para as próximas horas em todos os leitos ou filtrado por leito/internação, sinalizando doses em atraso.',
  })
  @ApiOkResponse({
    description: 'Fila de itens pendentes para o plantão.',
    type: [PendingScheduleItemResponseDto],
  })
  async findPendingSchedule(
    @Query() query: PendingScheduleQueryDto,
  ): Promise<PendingScheduleItemResponseDto[]> {
    return this.prescriptionsService.findPendingSchedule(query);
  }

  @Patch('prescription-items/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @ApiOperation({
    summary: 'Suspender / Cancelar Item de Prescrição',
    description:
      'Permite ao médico veterinário suspender pontualmente um medicamento ou checagem antes de sua aplicação, com justificativa clínica obrigatória gravada em prontuário.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do item da prescrição médica (PrescriptionItem)',
    example: '5fa85f64-5717-4562-b3fc-2c963f66afa8',
  })
  @ApiOkResponse({
    description: 'Item de prescrição cancelado com sucesso.',
    type: CancelItemResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Item já aplicado anteriormente ou já cancelado.',
  })
  @ApiNotFoundResponse({
    description: 'Item de prescrição não encontrado.',
  })
  @ApiForbiddenResponse({
    description: 'Apenas VET ou ADMIN podem suspender itens de prescrição.',
  })
  async cancelItem(
    @Param('id') itemId: string,
    @Body() dto: CancelPrescriptionItemDto,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<CancelItemResponseDto> {
    return this.prescriptionsService.cancelItem(itemId, currentUserId, dto);
  }

  @Patch('prescriptions/:id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @ApiOperation({
    summary: 'Inativar Prescrição Médica',
    description:
      'Inativa uma prescrição existente para substituição de protocolo clínico, cancelando opcionalmente os itens que ainda estavam pendentes.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da prescrição a ser inativada',
    example: '4fa85f64-5717-4562-b3fc-2c963f66afa7',
  })
  @ApiOkResponse({
    description: 'Prescrição inativada com sucesso.',
    type: DeactivatePrescriptionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Prescrição já está inativa.',
  })
  @ApiNotFoundResponse({
    description: 'Prescrição não encontrada.',
  })
  @ApiForbiddenResponse({
    description: 'Apenas VET ou ADMIN podem inativar prescrições.',
  })
  async deactivate(
    @Param('id') prescriptionId: string,
    @Body() dto: DeactivatePrescriptionDto,
  ): Promise<DeactivatePrescriptionResponseDto> {
    return this.prescriptionsService.deactivate(prescriptionId, dto);
  }
}
