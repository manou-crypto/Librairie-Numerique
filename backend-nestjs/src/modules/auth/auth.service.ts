import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Initialisation automatique des rôles et du compte Super Admin initial si la BDD est vide
   */
  async onModuleInit() {
    try {
      const rolesCount = await this.prisma.role.count();
      if (rolesCount === 0) {
        console.log('🌱 Initialisation des rôles RBAC par défaut dans la BDD...');
        await this.prisma.role.createMany({
          data: [
            { code_role: 'ADMIN', libelle: 'Super Administrateur' },
            { code_role: 'GESTIONNAIRE_CATALOGUE', libelle: 'Gestionnaire du Catalogue' },
            { code_role: 'ACHETEUR_STOCK', libelle: 'Gestionnaire de Stock / Acheteur' },
            { code_role: 'CAISSIER', libelle: 'Caissier' },
          ],
        });
      }

      const adminRole = await this.prisma.role.findUnique({ where: { code_role: 'ADMIN' } });
      const usersCount = await this.prisma.utilisateur.count();

      if (usersCount === 0 && adminRole) {
        console.log('👤 Création du compte Super Admin initial (admin@librairie.ci / admin123)...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await this.prisma.utilisateur.create({
          data: {
            nom: 'Administrateur',
            prenom: 'Super',
            email: 'admin@librairie.ci',
            mot_de_passe_hash: hashedPassword,
            id_role: adminRole.id_role,
            statut: 'ACTIF',
          },
        });
      }
    } catch (error: any) {
      console.warn('⚠️ Seed initial reporté (la BDD n\'est pas encore migrée).', error.message);
    }
  }

  /**
   * Authentification utilisateur et génération JWT
   */
  async login(loginDto: LoginDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { email: loginDto.email },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (user.statut !== 'ACTIF') {
      throw new UnauthorizedException('Compte désactivé. Veuillez contacter l\'administrateur.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.mot_de_passe_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const payload = {
      sub: user.id_utilisateur,
      email: user.email,
      role: user.role.code_role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Enregistrer l'action dans le Log Audit
    await this.prisma.logAudit.create({
      data: {
        id_utilisateur: user.id_utilisateur,
        action: 'CONNEXION',
        entite_cible: 'UTILISATEUR',
        details_json: { email: user.email, role: user.role.code_role },
      },
    }).catch(() => {});

    return {
      user: {
        id: user.id_utilisateur,
        name: `${user.prenom} ${user.nom}`,
        email: user.email,
        role: user.role.code_role,
        avatarUrl: user.avatar_url || null,
        permissions: user.role.permissions.map((p) => p.permission.code_permission),
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Rafraîchissement de token JWT
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'librairie_numerique_super_secret_jwt_key_2026_x89f',
      });

      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return {
        accessToken: this.jwtService.sign(newPayload),
      };
    } catch {
      throw new UnauthorizedException('Jeton de rafraîchissement invalide ou expiré');
    }
  }
}
