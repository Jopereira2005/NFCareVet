import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
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
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, active: true },
    });

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
