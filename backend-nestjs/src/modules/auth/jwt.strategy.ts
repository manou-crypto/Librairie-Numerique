import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          if (req && req.cookies) {
            return req.cookies['auth_token'];
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'librairie_numerique_super_secret_jwt_key_2026_x89f',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id_utilisateur: payload.sub },
      include: { role: true },
    });

    if (!user || user.statut !== 'ACTIF') {
      throw new UnauthorizedException('Utilisateur inactif ou compte supprimé');
    }

    return {
      id: user.id_utilisateur,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role.code_role,
      roleLibelle: user.role.libelle,
    };
  }
}
