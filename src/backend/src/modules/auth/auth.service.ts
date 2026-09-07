import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
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
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.active) {
      throw new ForbiddenException('Usuário inativo no sistema.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.generateToken(user);
  }

  async badgeLogin(badgeLoginDto: BadgeLoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByBadgeUid(
      badgeLoginDto.badgeUid,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Crachá NFC não cadastrado ou não reconhecido.',
      );
    }

    if (!user.active) {
      throw new ForbiddenException('Usuário inativo no sistema.');
    }

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
