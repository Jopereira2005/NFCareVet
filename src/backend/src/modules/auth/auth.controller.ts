import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { BadgeLoginDto } from './dto/badge-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login convencional com e-mail e senha',
    description: 'Valida as credenciais do colaborador e retorna o token de acesso JWT junto aos dados básicos do perfil.',
  })
  @ApiOkResponse({
    description: 'Autenticação realizada com sucesso.',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas (e-mail ou senha incorretos) ou usuário inativo.',
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos (validação do formulário falhou).',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('badge-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login rápido via crachá NFC',
    description: 'Autentica o colaborador através da aproximação de seu crachá NFC físico no leitor do dispositivo/tablet.',
  })
  @ApiOkResponse({
    description: 'Autenticação via crachá realizada com sucesso.',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Crachá NFC não encontrado ou usuário associado inativo.',
  })
  @ApiBadRequestResponse({
    description: 'UID do crachá ausente ou em formato inválido.',
  })
  async badgeLogin(
    @Body() badgeLoginDto: BadgeLoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.badgeLogin(badgeLoginDto);
  }
}

