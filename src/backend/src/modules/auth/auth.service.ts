import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/repositories/users.repository';
import { LoginDto } from './dto/login.dto';
import { BadgeLoginDto } from './dto/badge-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmail(loginDto.email);

    if (!user) {
      this.logger.warn(`[AUTH] Falha de login: e-mail [${loginDto.email}] não encontrado.`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.active) {
      this.logger.warn(`[AUTH] Falha de login: usuário [${loginDto.email}] inativo no sistema.`);
      throw new ForbiddenException('Usuário inativo no sistema.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(`[AUTH] Falha de login: senha incorreta para [${loginDto.email}].`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    this.logger.log(`[AUTH] Usuário autenticado com sucesso: email=${user.email}, id=${user.id}`);
    return this.generateToken(user);
  }

  async badgeLogin(badgeLoginDto: BadgeLoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByBadgeUid(
      badgeLoginDto.badgeUid,
    );

    if (!user) {
      this.logger.warn(
        `[AUTH-NFC] Falha na autenticação: crachá [${badgeLoginDto.badgeUid}] não reconhecido.`,
      );
      throw new UnauthorizedException(
        'Crachá NFC não cadastrado ou não reconhecido.',
      );
    }

    if (!user.active) {
      this.logger.warn(
        `[AUTH-NFC] Falha na autenticação: colaborador [${user.name}] do crachá [${badgeLoginDto.badgeUid}] está inativo.`,
      );
      throw new ForbiddenException('Usuário inativo no sistema.');
    }

    this.logger.log(
      `[AUTH-NFC] Autenticação por crachá realizada com sucesso: crachaUid=${badgeLoginDto.badgeUid}, usuario=${user.name}, id=${user.id}`,
    );
    return this.generateToken(user);
  }

  private generateToken(user: {
    id: string;
    email: string;
    name: string;
    role: any;
    badgeUid: string | null;
  }): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        badgeUid: user.badgeUid,
      },
    };
  }
}
