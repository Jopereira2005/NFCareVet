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
import { ApplyMedicationResponseDto } from './dto/apply-medication-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Beira de Leito (Bedside)')
@ApiBearerAuth('JWT-auth')
@Controller('bedside')
export class BedsideController {
  constructor(private readonly bedsideService: BedsideService) {}

  @Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
  @Get(':publicCode')
  @ApiOperation({
    summary: 'Consultar prontuário rápido por código NFC',
    description:
      'Recupera as informações do paciente internado, canil/leito associado, prescrições ativas e histórico clínico a partir do código público da tag NFC escaneada.',
  })
  @ApiParam({
    name: 'publicCode',
    example: 'K-01-A9F3',
    description: 'Código público/slug associado à tag NFC do leito hospitalar',
  })
  @ApiOkResponse({
    description: 'Prontuário rápido retornado com sucesso.',
    type: QuickRecordResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Tag NFC não encontrada ou nenhuma internação ativa vinculada ao leito.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado (token JWT ausente ou expirado).',
  })
  @ApiForbiddenResponse({
    description: 'Perfil de usuário não autorizado (requer ADMIN, VET ou REC).',
  })
  async getQuickRecord(
    @Param('publicCode') publicCode: string,
  ): Promise<QuickRecordResponseDto> {
    return this.bedsideService.getQuickRecordByTag(publicCode);
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
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
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