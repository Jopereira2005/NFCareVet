import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { NfcTagsService } from './nfc-tags.service';
import { CreateNfcTagDto } from './dto/create-nfc-tag.dto';
import { NfcTagResponseDto } from './dto/nfc-tag-response.dto';

@ApiTags('Tags NFC')
@ApiBearerAuth('JWT-auth')
@Controller('nfc-tags')
export class NfcTagsController {
  constructor(private readonly nfcTagsService: NfcTagsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nova tag NFC',
    description:
      'Registra o identificador UID de uma tag NFC física no sistema e gera automaticamente o código público (publicCode) para uso hospitalar.',
  })
  @ApiCreatedResponse({
    description: 'Tag NFC cadastrada com sucesso.',
    type: NfcTagResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'UID inválido ou tag já cadastrada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  async create(@Body() createNfcTagDto: CreateNfcTagDto) {
    return this.nfcTagsService.registerTag(createNfcTagDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas as tags NFC',
    description: 'Retorna todas as tags cadastradas no sistema com seus respectivos códigos e URLs de destino.',
  })
  @ApiOkResponse({
    description: 'Lista de tags cadastradas.',
    type: [NfcTagResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  async findAll() {
    return this.nfcTagsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar tag NFC por ID',
    description: 'Obtém detalhes e status de uma tag NFC a partir de seu ID interno.',
  })
  @ApiParam({
    name: 'id',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID interno da tag NFC',
  })
  @ApiOkResponse({
    description: 'Tag NFC localizada com sucesso.',
    type: NfcTagResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Tag NFC não encontrada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  async findOne(@Param('id') id: string) {
    return this.nfcTagsService.findOne(id);
  }

  @Patch(':id/inactivate')
  @ApiOperation({
    summary: 'Inativar tag NFC',
    description: 'Desativa a tag NFC informada, impedindo novas leituras operacionais.',
  })
  @ApiParam({
    name: 'id',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID da tag a ser inativada',
  })
  @ApiOkResponse({
    description: 'Tag NFC inativada com sucesso.',
    type: NfcTagResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Tag NFC não encontrada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  async inactivate(@Param('id') id: string) {
    return this.nfcTagsService.inactivateTag(id);
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Ativar tag NFC',
    description: 'Reativa uma tag NFC que estava desativada.',
  })
  @ApiParam({
    name: 'id',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID da tag a ser ativada',
  })
  @ApiOkResponse({
    description: 'Tag NFC reativada com sucesso.',
    type: NfcTagResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Tag NFC não encontrada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  async activate(@Param('id') id: string) {
    return this.nfcTagsService.activateTag(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir tag NFC',
    description: 'Remove definitivamente o registro da tag NFC do banco de dados.',
  })
  @ApiParam({
    name: 'id',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID da tag a ser excluída',
  })
  @ApiOkResponse({
    description: 'Tag NFC removida com sucesso.',
  })
  @ApiNotFoundResponse({
    description: 'Tag NFC não encontrada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  async remove(@Param('id') id: string) {
    return this.nfcTagsService.removeTag(id);
  }
}

