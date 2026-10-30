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
  ApiConflictResponse,
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
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { GuardianSearchQueryDto } from './dto/guardian-search-query.dto';
import { GuardianResponseDto } from './dto/guardian-response.dto';

@ApiTags('Tutores (Guardians)')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar tutores',
    description:
      'Lista e filtra tutores por nome, CPF ou nome de qualquer um de seus pets vinculados.',
  })
  @ApiOkResponse({
    description: 'Lista de tutores encontrados com seus pets vinculados.',
    type: [GuardianResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  async search(
    @Query() query: GuardianSearchQueryDto,
  ): Promise<GuardianResponseDto[]> {
    return this.guardiansService.search(query.query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar perfil do tutor por ID',
    description:
      'Retorna os dados cadastrais, contatos e a lista de pacientes (pets) vinculados ao tutor.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do tutor',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiOkResponse({
    description: 'Tutor encontrado com sucesso.',
    type: GuardianResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Tutor não encontrado.' })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  async findById(@Param('id') id: string): Promise<GuardianResponseDto> {
    return this.guardiansService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar novo tutor',
    description: 'Registra um novo tutor responsável na clínica.',
  })
  @ApiCreatedResponse({
    description: 'Tutor cadastrado com sucesso.',
    type: GuardianResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos.',
  })
  @ApiConflictResponse({
    description: 'Já existe um tutor cadastrado com o CPF informado.',
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  async create(@Body() dto: CreateGuardianDto): Promise<GuardianResponseDto> {
    return this.guardiansService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar dados do tutor',
    description:
      'Atualiza nome, telefone, CPF, e-mail e endereço de um tutor existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do tutor',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiOkResponse({
    description: 'Dados do tutor atualizados com sucesso.',
    type: GuardianResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Tutor não encontrado.',
  })
  @ApiConflictResponse({
    description: 'CPF já em uso por outro tutor.',
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGuardianDto,
  ): Promise<GuardianResponseDto> {
    return this.guardiansService.update(id, dto);
  }
}
