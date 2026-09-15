import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

export const SYSTEM_PERMISSIONS = [
  { code_permission: 'VIEW_DASHBOARD', module: 'Principal', libelle: 'Tableau de bord' },
  { code_permission: 'VIEW_POS', module: 'Ventes', libelle: 'Point de vente (Caisse)' },
  { code_permission: 'VIEW_VENTES', module: 'Ventes', libelle: 'Historique des ventes' },
  { code_permission: 'VIEW_CATALOGUE', module: 'Catalogue', libelle: 'Produits & Catalogue' },
  { code_permission: 'VIEW_STOCK', module: 'Catalogue', libelle: 'Gestion des stocks' },
  { code_permission: 'VIEW_INVENTAIRE', module: 'Catalogue', libelle: 'Inventaires' },
  { code_permission: 'VIEW_ACHATS', module: 'Catalogue', libelle: 'Commandes d\'achats' },
  { code_permission: 'VIEW_FOURNISSEURS', module: 'Catalogue', libelle: 'Fournisseurs' },
  { code_permission: 'VIEW_GESTION_CATALOGUE', module: 'Catalogue', libelle: 'Gestion Catalogue' },
  { code_permission: 'VIEW_FINANCES', module: 'Gestion', libelle: 'Finances & Clôtures' },
  { code_permission: 'VIEW_UTILISATEURS', module: 'Gestion', libelle: 'Utilisateurs & Rôles' },
  { code_permission: 'VIEW_RAPPORTS', module: 'Gestion', libelle: 'Rapports & Statistiques' },
  { code_permission: 'VIEW_CAISSES', module: 'Gestion', libelle: 'Gestion des caisses' },
  { code_permission: 'VIEW_PARAMETRES', module: 'Système', libelle: 'Paramètres généraux' },
  { code_permission: 'VIEW_NOTIFICATIONS', module: 'Système', libelle: 'Notifications' },
  { code_permission: 'CLOTURER_CAISSE', module: 'Ventes', libelle: 'Clôturer une session de caisse' },
  { code_permission: 'GERER_TARIFS', module: 'Catalogue', libelle: 'Gérer les tarifs & types de vente' },
];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private async ensurePermissionsSeeded() {
    try {
      for (const p of SYSTEM_PERMISSIONS) {
        await this.prisma.permission.upsert({
          where: { code_permission: p.code_permission },
          update: { module: p.module },
          create: {
            code_permission: p.code_permission,
            module: p.module,
          },
        });
      }

      // Initialiser les permissions du rôle ADMIN par défaut si vide
      const adminRole = await this.prisma.role.findUnique({
        where: { code_role: 'ADMIN' },
        include: { permissions: true },
      });
      if (adminRole && adminRole.permissions.length === 0) {
        const allPerms = await this.prisma.permission.findMany();
        for (const perm of allPerms) {
          await this.prisma.rolePermission.create({
            data: {
              id_role: adminRole.id_role,
              id_permission: perm.id_permission,
            },
          }).catch(() => {});
        }
      }
    } catch (e) {
      // Ignorer si la BDD est en cours d'initialisation
    }
  }

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

  async update(id: number, data: any) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id_utilisateur: id },
      include: { role: true },
    });
    if (!user) throw new NotFoundException(`Utilisateur #${id} introuvable`);

    // Sécurité : Interdire la désactivation d'un compte Administrateur
    if (data.statut === 'INACTIF' && user.role.code_role === 'ADMIN') {
      throw new BadRequestException("Un compte avec le rôle Administrateur ne peut pas être désactivé.");
    }

    const updateData: any = {};
    if (data.nom) updateData.nom = data.nom;
    if (data.prenom) updateData.prenom = data.prenom;
    if (data.email) {
      const existingEmail = await this.prisma.utilisateur.findFirst({
        where: { email: data.email, NOT: { id_utilisateur: id } },
      });
      if (existingEmail) throw new ConflictException('Cet email est déjà utilisé par un autre compte.');
      updateData.email = data.email;
    }
    if (data.codeRole) {
      const role = await this.prisma.role.findUnique({ where: { code_role: data.codeRole } });
      if (!role) throw new NotFoundException(`Rôle '${data.codeRole}' introuvable`);
      updateData.id_role = role.id_role;
    }
    if (data.password) {
      updateData.mot_de_passe_hash = await bcrypt.hash(data.password, 10);
    }
    if (data.statut) {
      updateData.statut = data.statut;
    }

    const updated = await this.prisma.utilisateur.update({
      where: { id_utilisateur: id },
      data: updateData,
      include: { role: true },
    });

    return {
      id: updated.id_utilisateur,
      nom: updated.nom,
      prenom: updated.prenom,
      email: updated.email,
      codeRole: updated.role.code_role,
      libelleRole: updated.role.libelle,
      statut: updated.statut,
    };
  }

  async getPermissions() {
    await this.ensurePermissionsSeeded();
    const perms = await this.prisma.permission.findMany({
      orderBy: { id_permission: 'asc' },
    });

    const permMap = new Map(SYSTEM_PERMISSIONS.map(sp => [sp.code_permission, sp]));
    return perms.map(p => ({
      id: p.id_permission,
      codePermission: p.code_permission,
      module: p.module,
      libelle: permMap.get(p.code_permission)?.libelle || p.code_permission,
    }));
  }

  async getRoles() {
    await this.ensurePermissionsSeeded();
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { utilisateurs: true },
        },
      },
      orderBy: { id_role: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id_role,
      codeRole: r.code_role,
      libelle: r.libelle,
      usersCount: r._count.utilisateurs,
      permissions: r.permissions.map((p) => p.permission.code_permission),
    }));
  }

  async getRoleById(id: number) {
    const r = await this.prisma.role.findUnique({
      where: { id_role: id },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { utilisateurs: true },
        },
      },
    });
    if (!r) throw new NotFoundException(`Rôle #${id} introuvable`);

    return {
      id: r.id_role,
      codeRole: r.code_role,
      libelle: r.libelle,
      usersCount: r._count.utilisateurs,
      permissions: r.permissions.map((p) => p.permission.code_permission),
    };
  }

  async createRole(data: { codeRole: string; libelle: string; permissions?: string[] }) {
    const formattedCode = data.codeRole.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await this.prisma.role.findUnique({ where: { code_role: formattedCode } });
    if (existing) {
      throw new ConflictException(`Le rôle '${formattedCode}' existe déjà`);
    }

    const role = await this.prisma.role.create({
      data: {
        code_role: formattedCode,
        libelle: data.libelle.trim(),
      },
    });

    if (data.permissions && data.permissions.length > 0) {
      const perms = await this.prisma.permission.findMany({
        where: { code_permission: { in: data.permissions } },
      });
      for (const p of perms) {
        await this.prisma.rolePermission.create({
          data: {
            id_role: role.id_role,
            id_permission: p.id_permission,
          },
        });
      }
    }

    return this.getRoleById(role.id_role);
  }

  async updateRole(id: number, data: { libelle?: string; permissions?: string[] }) {
    const role = await this.prisma.role.findUnique({ where: { id_role: id } });
    if (!role) throw new NotFoundException(`Rôle #${id} introuvable`);

    if (data.libelle) {
      await this.prisma.role.update({
        where: { id_role: id },
        data: { libelle: data.libelle.trim() },
      });
    }

    if (data.permissions !== undefined) {
      await this.prisma.rolePermission.deleteMany({ where: { id_role: id } });
      if (data.permissions.length > 0) {
        const perms = await this.prisma.permission.findMany({
          where: { code_permission: { in: data.permissions } },
        });
        for (const p of perms) {
          await this.prisma.rolePermission.create({
            data: {
              id_role: id,
              id_permission: p.id_permission,
            },
          });
        }
      }
    }

    return this.getRoleById(id);
  }

  async deleteRole(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id_role: id },
      include: { utilisateurs: true },
    });
    if (!role) throw new NotFoundException(`Rôle #${id} introuvable`);

    if (role.code_role === 'ADMIN') {
      throw new BadRequestException("Le rôle Administrateur (ADMIN) ne peut pas être supprimé.");
    }

    if (role.utilisateurs.length > 0) {
      throw new BadRequestException(
        `Ce rôle est actuellement attribué à ${role.utilisateurs.length} utilisateur(s). Réassignez-les avant de le supprimer.`
      );
    }

    await this.prisma.rolePermission.deleteMany({ where: { id_role: id } });
    await this.prisma.role.delete({ where: { id_role: id } });

    return { success: true, message: 'Rôle supprimé avec succès.' };
  }

  async updateProfile(id: number, data: { nom: string; prenom: string; email: string; telephone?: string }) {
    const existing = await this.prisma.utilisateur.findFirst({
      where: { email: data.email, NOT: { id_utilisateur: id } },
    });
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé par un autre compte.');
    }

    const updated = await this.prisma.utilisateur.update({
      where: { id_utilisateur: id },
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        // Si le téléphone était dans le schéma on le mettrait, mais on va juste l'ignorer si non présent
      },
      include: { role: true }
    });

    return {
      id: updated.id_utilisateur,
      nom: updated.nom,
      prenom: updated.prenom,
      email: updated.email,
      codeRole: updated.role.code_role,
      libelleRole: updated.role.libelle,
    };
  }

  async updatePassword(id: number, actuel: string, nouveau: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id_utilisateur: id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const isMatch = await bcrypt.compare(actuel, user.mot_de_passe_hash);
    if (!isMatch) {
      throw new ConflictException('Le mot de passe actuel est incorrect.');
    }

    const hashed = await bcrypt.hash(nouveau, 10);
    await this.prisma.utilisateur.update({
      where: { id_utilisateur: id },
      data: { mot_de_passe_hash: hashed }
    });

    return { success: true, message: 'Mot de passe mis à jour avec succès.' };
  }

  async remove(id: number) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id_utilisateur: id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // 1. Détacher les caisses assignées
    await this.prisma.caisse.updateMany({
      where: { id_utilisateur: id },
      data: { id_utilisateur: null }
    });

    // 2. Trouver l'administrateur principal pour réassigner les opérations historiques si nécessaire
    const admin = await this.prisma.utilisateur.findFirst({
      where: { role: { code_role: 'ADMIN' }, id_utilisateur: { not: id } }
    });
    const fallbackUserId = admin ? admin.id_utilisateur : 1;

    // 3. Réassigner / détacher les relations sans casser l'intégrité
    await this.prisma.mouvementStock.updateMany({
      where: { id_utilisateur: id },
      data: { id_utilisateur: fallbackUserId }
    }).catch(() => {});

    await this.prisma.achat.updateMany({
      where: { id_utilisateur: id },
      data: { id_utilisateur: fallbackUserId }
    }).catch(() => {});

    await this.prisma.inventaire.updateMany({
      where: { id_utilisateur: id },
      data: { id_utilisateur: fallbackUserId }
    }).catch(() => {});

    await this.prisma.clotureJournaliere.updateMany({
      where: { id_utilisateur_validation: id },
      data: { id_utilisateur_validation: fallbackUserId }
    }).catch(() => {});

    await this.prisma.sessionCaisse.updateMany({
      where: { id_utilisateur: id },
      data: { id_utilisateur: fallbackUserId }
    }).catch(() => {});

    await this.prisma.historiquePrix.updateMany({
      where: { id_utilisateur: id },
      data: { id_utilisateur: fallbackUserId }
    }).catch(() => {});

    // 4. Supprimer l'utilisateur
    await this.prisma.utilisateur.delete({
      where: { id_utilisateur: id }
    });

    return { success: true, message: 'Utilisateur supprimé avec succès.' };
  }
}
