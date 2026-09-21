import {
  Controller,
  Get,
  Post,
  Param,
  Body,
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
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HospitalizationsService } from './hospitalizations.service';
import { CreateHospitalizationDto } from './dto/create-hospitalization.dto';
import { TransferKennelDto } from './dto/transfer-kennel.dto';
import { LinkTagDto } from './dto/link-tag.dto';
import { UnlinkTagDto } from './dto/unlink-tag.dto';
import { DischargeDto } from './dto/discharge.dto';
import {
  HospitalizationResponseDto,
  LinkTagResponseDto,
  UnlinkTagResponseDto,
  TransferKennelResponseDto,
  DischargeResponseDto,
} from './dto/hospitalization-response.dto';

@ApiTags('Internações (Hospitalizations)')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
@Controller('hospitalizations')
export class HospitalizationsController {
  constructor(private readonly service: HospitalizationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.VET)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Admissão Hospitalar (Check-in)',
    description:
      'Cria uma nova internação vinculando obrigatoriamente patientId, kennelId, motivo da admissão (admissionReason), diagnóstico preliminar e o veterinário responsável. Suporta vincular opcionalmente no mesmo ato uma tag NFC física disponível no inventário.',
  })
  @ApiCreatedResponse({
    description: 'Admissão hospitalar realizada com sucesso.',
    type: HospitalizationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Campos obrigatórios inválidos, baia inativa ou tag inativada.',
  })
  @ApiNotFoundResponse({
    description: 'Paciente, baia, tag NFC ou veterinário responsável não encontrado.',
  })
  @ApiConflictResponse({
    description: 'Paciente já internado, baia já ocupada ou tag já em uso por outro paciente.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso restrito a Médicos Veterinários (VET) ou Administradores (ADMIN).',
  })
  async create(
    @Body() dto: CreateHospitalizationDto,
    @CurrentUser('userId') userId: string,
  ): Promise<HospitalizationResponseDto> {
    return this.service.create(dto, userId);
  }

  @Post(':id/transfer-kennel')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transferência de Leito / Baia',
    description:
      'Movimenta o paciente internado para outro canil/leito disponível. Registra a transição gerando automaticamente um evento clínico de movimentação interna com data/hora e usuário executor.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da internação ativa',
    example: 'uuid-hosp-1',
  })
  @ApiOkResponse({
    description: 'Transferência de leito realizada com sucesso.',
    type: TransferKennelResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Internação não ativa, baia de destino inativa ou paciente já alocado na mesma baia.',
  })
  @ApiNotFoundResponse({
    description: 'Internação ou baia de destino não encontrada.',
  })
  @ApiConflictResponse({
    description: 'A baia de destino já está ocupada por outro paciente ativo.',
  })
  async transferKennel(
    @Param('id') id: string,
    @Body() dto: TransferKennelDto,
    @CurrentUser('userId') userId: string,
  ): Promise<TransferKennelResponseDto> {
    return this.service.transferKennel(id, dto, userId);
  }

  @Post(':id/link-tag')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vincular tag NFC à internação',
    description:
      'Vincula uma tag NFC física ativa à internação do paciente. Aceita UID de hardware, publicCode ou UUID da tag.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da internação ativa',
    example: 'uuid-hosp-1',
  })
  @ApiOkResponse({
    description: 'Tag NFC vinculada com sucesso.',
    type: LinkTagResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Tag inativa ou internação não está ativa.',
  })
  @ApiNotFoundResponse({
    description: 'Internação ou tag não encontrada.',
  })
  @ApiConflictResponse({
    description: 'Tag já vinculada a outra internação ativa.',
  })
  async linkTag(
    @Param('id') id: string,
    @Body() dto: LinkTagDto,
    @CurrentUser('userId') userId: string,
  ): Promise<LinkTagResponseDto> {
    return this.service.linkTag(id, dto, userId);
  }

  @Post(':id/unlink-tag')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desvincular tag NFC da internação',
    description:
      'Desvincula a tag NFC da internação, liberando o chip físico no inventário para reuso e registrando auditoria clínica.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da internação ativa',
    example: 'uuid-hosp-1',
  })
  @ApiOkResponse({
    description: 'Tag desvinculada com sucesso.',
    type: UnlinkTagResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Internação não ativa ou não possui tag vinculada.',
  })
  @ApiNotFoundResponse({
    description: 'Internação não encontrada.',
  })
  async unlinkTag(
    @Param('id') id: string,
    @Body() dto: UnlinkTagDto,
    @CurrentUser('userId') userId: string,
  ): Promise<UnlinkTagResponseDto> {
    return this.service.unlinkTag(id, dto, userId);
  }

  @Post('patient/:patientId/link-tag')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vincular tag NFC diretamente ao paciente',
    description:
      'Localiza a internação ativa do paciente especificado e vincula a tag NFC correspondente.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'UUID do paciente',
    example: 'uuid-patient-1',
  })
  @ApiOkResponse({
    description: 'Tag NFC vinculada com sucesso.',
    type: LinkTagResponseDto,
  })
  async linkTagToPatient(
    @Param('patientId') patientId: string,
    @Body() dto: LinkTagDto,
    @CurrentUser('userId') userId: string,
  ): Promise<LinkTagResponseDto> {
    return this.service.linkTagToPatient(patientId, dto, userId);
  }

  @Post('patient/:patientId/unlink-tag')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desvincular tag NFC diretamente do paciente',
    description:
      'Localiza a internação ativa do paciente especificado e desvincula a tag NFC atualmente alocada.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'UUID do paciente',
    example: 'uuid-patient-1',
  })
  @ApiOkResponse({
    description: 'Tag NFC desvinculada com sucesso.',
    type: UnlinkTagResponseDto,
  })
  async unlinkTagFromPatient(
    @Param('patientId') patientId: string,
    @Body() dto: UnlinkTagDto,
    @CurrentUser('userId') userId: string,
  ): Promise<UnlinkTagResponseDto> {
    return this.service.unlinkTagFromPatient(patientId, dto, userId);
  }

  @Post(':id/discharge')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alta Hospitalar / Check-out',
    description:
      'Conclui a internação com data de encerramento, motivo da alta (alta médica, transferência externa ou óbito) e instruções pós-alta. Libera automaticamente o leito e remove o vínculo ativo da nfcTagId para reutilização imediata.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da internação',
    example: 'uuid-hosp-1',
  })
  @ApiOkResponse({
    description: 'Alta hospitalar realizada com sucesso.',
    type: DischargeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Internação não está ativa ou já finalizada.',
  })
  @ApiNotFoundResponse({
    description: 'Internação não encontrada.',
  })
  async discharge(
    @Param('id') id: string,
    @Body() dto: DischargeDto,
    @CurrentUser('userId') userId: string,
  ): Promise<DischargeResponseDto> {
    return this.service.discharge(id, dto, userId);
  }

  @Post('patient/:patientId/discharge')
  @Roles(UserRole.ADMIN, UserRole.VET)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dar alta médica por ID do paciente',
    description:
      'Localiza a internação ativa do paciente especificado e realiza o procedimento de alta médica hospitalar.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'UUID do paciente',
    example: 'uuid-patient-1',
  })
  @ApiOkResponse({
    description: 'Alta hospitalar realizada com sucesso.',
    type: DischargeResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Nenhuma internação ativa encontrada para o paciente.',
  })
  async dischargeByPatient(
    @Param('patientId') patientId: string,
    @Body() dto: DischargeDto,
    @CurrentUser('userId') userId: string,
  ): Promise<DischargeResponseDto> {
    return this.service.dischargeByPatient(patientId, dto, userId);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Listar internações ativas (Painel Principal)',
    description:
      'Retorna a relação de todos os animais internados, com baia alocada, tag NFC associada, dados do tutor e alertas clínicos rápidos (jejum, alergias e comportamento).',
  })
  @ApiOkResponse({
    description: 'Lista de internações ativas para o painel.',
    type: [HospitalizationResponseDto],
  })
  async findAllActive(): Promise<HospitalizationResponseDto[]> {
    return this.service.findAllActive();
  }

  @Get('patient/:patientId/active')
  @ApiOperation({
    summary: 'Buscar internação ativa de um paciente',
    description: 'Retorna a internação ativa atual do paciente.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'UUID do paciente',
    example: 'uuid-patient-1',
  })
  @ApiOkResponse({
    description: 'Internação ativa do paciente.',
    type: HospitalizationResponseDto,
  })
  async findActiveByPatient(
    @Param('patientId') patientId: string,
  ): Promise<HospitalizationResponseDto> {
    return this.service.findActiveByPatient(patientId);
  }

  @Get('patient/:patientId/history')
  @ApiOperation({
    summary: 'Histórico de internações do paciente',
    description:
      'Histórico completo de internações passadas do animal com linha do tempo de eventos clínicos para suporte a diagnósticos futuros.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'UUID do paciente',
    example: 'uuid-patient-1',
  })
  @ApiOkResponse({
    description: 'Histórico de internações do paciente ordenadas pela mais recente.',
    type: [HospitalizationResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Paciente não encontrado.',
  })
  async findHistoryByPatient(
    @Param('patientId') patientId: string,
  ): Promise<HospitalizationResponseDto[]> {
    return this.service.findHistoryByPatient(patientId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar internação por ID',
    description: 'Retorna os detalhes de uma internação específica com eventos clínicos e alertas.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da internação',
    example: 'uuid-hosp-1',
  })
  @ApiOkResponse({
    description: 'Detalhes da internação.',
    type: HospitalizationResponseDto,
  })
  async findById(@Param('id') id: string): Promise<HospitalizationResponseDto> {
    return this.service.findById(id);
  }
}
