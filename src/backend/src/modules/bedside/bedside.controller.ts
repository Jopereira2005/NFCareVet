import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BedsideService } from './bedside.service';
import { ApplyMedicationDto } from './dto/apply-medication.dto';
import { QuickRecordResponseDto } from './dto/quick-record-response.dto';
import { FullRecordResponseDto } from './dto/full-record-response.dto';
import { ApplyMedicationResponseDto } from './dto/apply-medication-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Beira de Leito / Leitor NFC (Bedside)')
@ApiBearerAuth('JWT-auth')
@Controller('bedside')
export class BedsideController {
  constructor(private readonly bedsideService: BedsideService) {}

  @Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
  @Get(':identifier/full')
  @ApiOperation({
    summary: 'Modo Consulta: Consultar prontuário COMPLETO da coleira NFC',
    description:
      'Recupera a ficha clínica aprofundada do paciente internado a partir da leitura da coleira NFC do animal. Inclui todos os protocolos de prescrições ativas na íntegra, linha do tempo detalhada e histórico de cuidados.',
  })
  @ApiParam({
    name: 'identifier',
    example: '04A23B89C16080',
    description: 'UID físico do chip NFC da coleira ou código público gerado',
  })
  @ApiOkResponse({
    description: 'Prontuário completo retornado com sucesso.',
    type: FullRecordResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Coleira NFC não encontrada ou nenhuma internação ativa vinculada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado (token JWT ausente ou expirado).',
  })
  @ApiForbiddenResponse({
    description: 'Perfil de usuário não autorizado (requer ADMIN, VET ou REC).',
  })
  async getFullRecord(
    @Param('identifier') identifier: string,
  ): Promise<FullRecordResponseDto> {
    return this.bedsideService.getFullRecordByTag(identifier);
  }

  @Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
  @Get(':identifier')
  @ApiOperation({
    summary: 'Modo Consulta: Consultar prontuário RÁPIDO (Breve) da coleira NFC',
    description:
      'Resposta leve e instantânea para leitura no celular à beira do leito. Retorna alertas clínicos visuais (jejum, tipo sanguíneo, alergias), baia alocada, última medição de sinais vitais e tarefas/medicações pendentes do plantão atual.',
  })
  @ApiParam({
    name: 'identifier',
    example: '04A23B89C16080',
    description: 'UID físico do chip NFC da coleira ou código público gerado',
  })
  @ApiOkResponse({
    description: 'Prontuário rápido retornado com sucesso.',
    type: QuickRecordResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Coleira NFC não encontrada ou nenhuma internação ativa vinculada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado (token JWT ausente ou expirado).',
  })
  @ApiForbiddenResponse({
    description: 'Perfil de usuário não autorizado (requer ADMIN, VET ou REC).',
  })
  async getQuickRecord(
    @Param('identifier') identifier: string,
  ): Promise<QuickRecordResponseDto> {
    return this.bedsideService.getBriefRecordByTag(identifier);
  }

  @Roles(UserRole.ADMIN, UserRole.VET)
  @Post('items/:id/apply')
  @ApiOperation({
    summary: 'Checar e aplicar item de prescrição',
    description:
      'Registra a administração de medicamento ou execução de procedimento à beira do leito, alterando o status para APPLIED e gravando o evento clínico no prontuário.',
  })
  @ApiParam({
    name: 'id',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID do item da prescrição médica (PrescriptionItem)',
  })
  @ApiOkResponse({
    description: 'Medicação/item aplicado com sucesso.',
    type: ApplyMedicationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Item já aplicado anteriormente ou dados inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Item da prescrição ou usuário não encontrado.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  @ApiForbiddenResponse({
    description: 'Apenas profissionais veterinários (VET) ou administradores (ADMIN) podem aplicar medicamentos.',
  })
  async applyItem(
    @Param('id') itemId: string,
    @CurrentUser('userId') userId: string,
    @Body() applyMedicationDto: ApplyMedicationDto,
  ): Promise<ApplyMedicationResponseDto> {
    return this.bedsideService.applyMedication(
      itemId,
      userId,
      applyMedicationDto?.bedsideNotes,
      applyMedicationDto?.metrics,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.VET)
  @Post('prescriptions/:id/apply')
  @ApiOperation({
    summary: 'Checar e aplicar medicação (Alias de compatibilidade)',
    description:
      'Rota alternativa compatível com versões anteriores do aplicativo para aplicar e checar itens de prescrição.',
  })
  @ApiParam({
    name: 'id',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID do item da prescrição',
  })
  @ApiOkResponse({
    description: 'Item aplicado com sucesso.',
    type: ApplyMedicationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Item já aplicado anteriormente ou dados inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Item da prescrição não encontrado.',
  })
  @ApiForbiddenResponse({
    description: 'Apenas VET ou ADMIN.',
  })
  async applyMedication(
    @Param('id') itemId: string,
    @CurrentUser('userId') userId: string,
    @Body() applyMedicationDto: ApplyMedicationDto,
  ): Promise<ApplyMedicationResponseDto> {
    return this.bedsideService.applyMedication(
      itemId,
      userId,
      applyMedicationDto?.bedsideNotes,
      applyMedicationDto?.metrics,
    );
  }
}