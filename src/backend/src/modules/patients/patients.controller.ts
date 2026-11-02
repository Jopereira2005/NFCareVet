import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserThrottlerGuard } from '../../common/guards/user-throttler.guard';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientSearchQueryDto } from './dto/patient-search-query.dto';
import { PatientVisitsQueryDto } from './dto/patient-visits-query.dto';
import {
  PatientResponseDto,
  PatientVisitResponseDto,
} from './dto/patient-response.dto';
import {
  GeneratePhotoUploadUrlDto,
  PhotoUploadUrlResponseDto,
} from './dto/patient-photo-upload.dto';

@ApiTags('Pacientes (Patients)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar e filtrar pacientes',
    description:
      'Lista e filtra os pacientes cadastrados por termo de busca (nome do pet, raça, nome do tutor ou código da tag NFC), espécie, sexo e situação de internação.',
  })
  @ApiOkResponse({
    description: 'Lista de pacientes encontrados.',
    type: [PatientResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  async search(
    @Query() query: PatientSearchQueryDto,
  ): Promise<PatientResponseDto[]> {
    return this.patientsService.search(query);
  }

  @Get('visits')
  @ApiOperation({
    summary: 'Listar atendimentos de pacientes por período',
    description:
      'Retorna a relação de pacientes atendidos/internados no período selecionado (today, week ou month) para a tela de Histórico.',
  })
  @ApiOkResponse({
    description: 'Lista de atendimentos no período.',
    type: [PatientVisitResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  async listVisits(
    @Query() query: PatientVisitsQueryDto,
  ): Promise<PatientVisitResponseDto[]> {
    return this.patientsService.listVisits(query.period);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar prontuário/cadastro do paciente por ID',
    description:
      'Retorna os dados cadastrais e clínicos do paciente, incluindo tutor responsável, tag NFC vinculada e internação ativa (se houver).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do paciente',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiOkResponse({
    description: 'Paciente encontrado com sucesso.',
    type: PatientResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Paciente não encontrado.' })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  async findById(@Param('id') id: string): Promise<PatientResponseDto> {
    return this.patientsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar novo paciente',
    description:
      'Registra um novo paciente (pet) vinculado a um tutor existente.',
  })
  @ApiCreatedResponse({
    description: 'Paciente cadastrado com sucesso.',
    type: PatientResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Tutor informado não encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  async create(@Body() dto: CreatePatientDto): Promise<PatientResponseDto> {
    return this.patientsService.create(dto);
  }

  @Post(':id/photo-upload-url')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Gerar Presigned URL do Cloudflare R2 para upload de foto do paciente',
    description:
      'Gera uma URL pré-assinada restrita (Content-Type e Content-Length assinados, máx. 3 MB, validade de 2 minutos) para upload direto ao Cloudflare R2. Possui trava de Rate Limit estrito de no máximo 5 solicitações por minuto por usuário.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do paciente',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiCreatedResponse({
    description: 'URL pré-assinada gerada com sucesso.',
    type: PhotoUploadUrlResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'MIME type não suportado ou arquivo maior que 3 MB.',
  })
  @ApiNotFoundResponse({
    description: 'Paciente não encontrado.',
  })
  @ApiTooManyRequestsResponse({
    description:
      'Limite de 5 solicitações de upload por minuto excedido para este usuário.',
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  async generatePhotoUploadUrl(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: GeneratePhotoUploadUrlDto,
  ): Promise<PhotoUploadUrlResponseDto> {
    return this.patientsService.generatePhotoUploadUrl(id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar dados do paciente (e substituir/limpar foto com exclusão automática no R2)',
    description:
      'Atualiza os dados cadastrais, clínicos, alertas e a photoUrl de um paciente existente. Caso uma foto anterior exista no Cloudflare R2 e seja substituída ou removida, o objeto antigo é excluído automaticamente do bucket.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do paciente',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiOkResponse({
    description: 'Paciente atualizado com sucesso.',
    type: PatientResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Paciente ou tutor não encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientsService.update(id, dto);
  }
}
