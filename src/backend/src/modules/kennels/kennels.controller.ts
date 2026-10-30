import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { KennelsService } from './kennels.service';
import { KennelResponseDto } from './dto/kennel-response.dto';

@ApiTags('Baias / Leitos (Kennels)')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
@Controller('kennels')
export class KennelsController {
  constructor(private readonly service: KennelsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar baias ativas com ocupação atual',
    description:
      'Retorna todas as baias ativas ordenadas por nome, incluindo o paciente que ocupa cada baia no momento (occupant: { patientId, patientName } | null). Usado nos modais de admissão e transferência de baia.',
  })
  @ApiOkResponse({
    description: 'Lista de baias ativas com ocupante atual.',
    type: [KennelResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado.' })
  @ApiForbiddenResponse({ description: 'Acesso negado.' })
  async list(): Promise<KennelResponseDto[]> {
    return this.service.listActive();
  }
}
