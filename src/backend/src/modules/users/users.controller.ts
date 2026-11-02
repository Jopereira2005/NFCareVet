import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserThrottlerGuard } from '../../common/guards/user-throttler.guard';
import {
  GeneratePhotoUploadUrlDto,
  PhotoUploadUrlResponseDto,
} from '../patients/dto/patient-photo-upload.dto';

@ApiTags('Usuários')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo usuário',
    description:
      'Cadastra um novo colaborador no sistema (VET, ADMIN ou REC). Permite vincular opcionalmente o UID do crachá NFC.',
  })
  @ApiCreatedResponse({
    description: 'Usuário cadastrado com sucesso.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'E-mail ou UID de crachá já cadastrado, ou campos obrigatórios inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso restrito a administradores (ADMIN).',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Post(':id/avatar-upload-url')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Gerar Presigned URL do Cloudflare R2 para upload de avatar do colaborador',
    description:
      'Gera uma URL pré-assinada restrita (Content-Type e Content-Length assinados, máx. 3 MB, validade de 2 minutos) para upload direto ao Cloudflare R2 na pasta users/{id}.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do colaborador',
    example: 'd3b07384-d113-460f-93d3-7d72c1c68e1a',
  })
  @ApiCreatedResponse({
    description: 'URL pré-assinada gerada com sucesso.',
    type: PhotoUploadUrlResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'MIME type não suportado ou arquivo maior que 3 MB.',
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
  })
  @ApiTooManyRequestsResponse({
    description: 'Limite de 5 solicitações de upload por minuto excedido.',
  })
  async generateAvatarUploadUrl(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: GeneratePhotoUploadUrlDto,
  ): Promise<PhotoUploadUrlResponseDto> {
    return this.usersService.generateAvatarUploadUrl(id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os colaboradores',
    description: 'Retorna a lista completa de usuários cadastrados.',
  })
  @ApiOkResponse({
    description: 'Lista de colaboradores.',
    type: [UserResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso restrito a administradores (ADMIN).',
  })
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna os dados de perfil de um colaborador através de seu UUID.',
  })
  @ApiParam({
    name: 'id',
    example: 'd3b07384-d113-460f-93d3-7d72c1c68e1a',
    description: 'UUID do usuário',
  })
  @ApiOkResponse({
    description: 'Colaborador encontrado.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso restrito a administradores (ADMIN).',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar usuário',
    description:
      'Atualiza os dados de cadastro de um colaborador (nome, e-mail, senha, cargo, crachá NFC, avatarUrl ou status ativo).',
  })
  @ApiParam({
    name: 'id',
    example: 'd3b07384-d113-460f-93d3-7d72c1c68e1a',
    description: 'UUID do usuário a ser atualizado',
  })
  @ApiOkResponse({
    description: 'Colaborador atualizado com sucesso.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou e-mail/crachá já em uso por outro usuário.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso restrito a administradores (ADMIN).',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover usuário',
    description: 'Exclui o registro do colaborador do sistema.',
  })
  @ApiParam({
    name: 'id',
    example: 'd3b07384-d113-460f-93d3-7d72c1c68e1a',
    description: 'UUID do usuário a ser removido',
  })
  @ApiOkResponse({
    description: 'Colaborador removido com sucesso.',
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso restrito a administradores (ADMIN).',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }
}
