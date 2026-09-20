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
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HospitalizationsService } from './hospitalizations.service';
import { LinkTagDto } from './dto/link-tag.dto';
import { UnlinkTagDto } from './dto/unlink-tag.dto';
import {
  HospitalizationResponseDto,
  LinkTagResponseDto,
  UnlinkTagResponseDto,
} from './dto/hospitalization-response.dto';

@ApiTags('Internações (Hospitalizations)')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
@Controller('hospitalizations')
export class HospitalizationsController {
  constructor(private readonly service: HospitalizationsService) {}

  @Post(':id/link-tag')
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
  @ApiUnauthorizedResponse({
    description: 'Não autenticado.',
  })
  async linkTag(
    @Param('id') id: string,
    @Body() dto: LinkTagDto,
    @CurrentUser('userId') userId: string,
  ): Promise<LinkTagResponseDto> {
    return this.service.linkTag(id, dto, userId);
  }

  @Post(':id/unlink-tag')
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

  @Get('active')
  @ApiOperation({
    summary: 'Listar internações ativas',
    description:
      'Retorna todas as internações em andamento com dados do paciente, baia e tag NFC.',
  })
  @ApiOkResponse({
    description: 'Lista de internações ativas.',
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

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar internação por ID',
    description: 'Retorna os detalhes de uma internação específica.',
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
