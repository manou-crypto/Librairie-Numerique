import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.utilisateur.findMany({
      include: { role: true },
      orderBy: { id_utilisateur: 'asc' },
    });

    return users.map((u) => ({
      id: u.id_utilisateur,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      roleId: u.id_role,
      codeRole: u.role.code_role,
      libelleRole: u.role.libelle,
      statut: u.statut,
    }));
  }

  async findOne(id: number) {
    const u = await this.prisma.utilisateur.findUnique({
      where: { id_utilisateur: id },
      include: { role: true },
    });

    if (!u) throw new NotFoundException(`Utilisateur #${id} introuvable`);

    return {
      id: u.id_utilisateur,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      roleId: u.id_role,
      codeRole: u.role.code_role,
      libelleRole: u.role.libelle,
      statut: u.statut,
    };
  }

  async create(data: { nom: string; prenom: string; email: string; password: string; codeRole: string }) {
    const existing = await this.prisma.utilisateur.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const role = await this.prisma.role.findUnique({ where: { code_role: data.codeRole } });
    if (!role) {
      throw new NotFoundException(`Rôle '${data.codeRole}' introuvable`);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.utilisateur.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        mot_de_passe_hash: hashedPassword,
        id_role: role.id_role,
        statut: 'ACTIF',
      },
      include: { role: true },
    });

    return {
      id: user.id_utilisateur,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      codeRole: user.role.code_role,
      libelleRole: user.role.libelle,
      statut: user.statut,
    };
  }

  async getRoles() {
    return this.prisma.role.findMany();
  }
}
