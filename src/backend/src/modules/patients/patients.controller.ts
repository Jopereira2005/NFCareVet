import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientSearchQueryDto } from './dto/patient-search-query.dto';
import { PatientVisitsQueryDto } from './dto/patient-visits-query.dto';
import {
  PatientResponseDto,
  PatientVisitResponseDto,
} from './dto/patient-response.dto';

@ApiTags('Pacientes (Patients)')
@ApiBearerAuth('JWT-auth')
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

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar dados do paciente',
    description:
      'Atualiza os dados cadastrais, clínicos e alertas (alergias, comportamento, peso, castração) de um paciente existente.',
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
