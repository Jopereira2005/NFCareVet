import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { UsersRepository } from '../../users/repositories/users.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'nfcarevet_default_jwt_secret_key_2026',
      ),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findById(payload.sub);

    if (!user || !user.active) {
      throw new UnauthorizedException(
        'Usuário inativo ou inexistente. Acesso não autorizado.',
      );
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
