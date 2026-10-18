import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      // S'assurer que le client comptoir par défaut existe
      const walkIn = await this.prisma.client.findFirst({
        where: { code_client: 'CLI-0000' },
      });

      if (!walkIn) {
        await this.prisma.client.create({
          data: {
            code_client: 'CLI-0000',
            nom: 'Walk-In Customer',
            prenom: '',
            telephone: '',
            type_client: 'PARTICULIER',
            notes: 'Client comptoir / passager par défaut',
          },
        });
      }
    } catch (err: any) {
      console.warn('ClientsService onModuleInit initialization notice:', err?.message || err);
    }
  }

  private async generateNextCodeClient(): Promise<string> {
    const lastClient = await this.prisma.client.findFirst({
      where: { code_client: { not: 'CLI-0000' } },
      orderBy: { id_client: 'desc' },
    });

    if (!lastClient) {
      return 'CLI-0001';
    }

    const match = lastClient.code_client.match(/CLI-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `CLI-${String(nextNum).padStart(4, '0')}`;
    }

    return `CLI-${lastClient.id_client + 1}`;
  }

  async findAll(query?: { search?: string; typeClient?: string }) {
    const where: any = {};

    if (query?.typeClient && query.typeClient !== 'TOUS') {
      where.type_client = query.typeClient;
    }

    if (query?.search && query.search.trim() !== '') {
      const term = query.search.trim();
      where.OR = [
        { nom: { contains: term } },
        { prenom: { contains: term } },
        { telephone: { contains: term } },
        { code_client: { contains: term } },
      ];
    }

    const list = await this.prisma.client.findMany({
      where,
      orderBy: [{ code_client: 'asc' }],
      include: {
        ventes: {
          select: {
            id_vente: true,
            total_ttc: true,
            date_vente: true,
            statut_vente: true,
          },
        },
      },
    });

    return list.map((c) => {
      const validesVentes = c.ventes.filter((v) => v.statut_vente === 'VALIDEE');
      const totalAchats = validesVentes.reduce(
        (sum, v) => sum + Number(v.total_ttc),
        0,
      );
      const derniereVente = validesVentes.length > 0
        ? validesVentes.reduce((latest, v) => (v.date_vente > latest ? v.date_vente : latest), validesVentes[0].date_vente)
        : null;

      return {
        id: c.id_client,
        codeClient: c.code_client,
        nom: c.nom,
        prenom: c.prenom || '',
        nomComplet: c.prenom ? `${c.nom} ${c.prenom}` : c.nom,
        telephone: c.telephone || '',
        email: c.email || '',
        adresse: c.adresse || '',
        typeClient: c.type_client,
        notes: c.notes || '',
        dateCreation: c.date_creation,
        nombreVentes: validesVentes.length,
        totalAchats,
        derniereVisite: derniereVente,
      };
    });
  }

  async findOne(id: number) {
    const c = await this.prisma.client.findUnique({
      where: { id_client: id },
      include: {
        ventes: {
          orderBy: { date_vente: 'desc' },
          take: 50,
          include: {
            lignes: {
              include: { produit: true },
            },
            paiements: true,
          },
        },
      },
    });

    if (!c) throw new NotFoundException(`Client #${id} introuvable`);

    const validesVentes = c.ventes.filter((v) => v.statut_vente === 'VALIDEE');
    const totalAchats = validesVentes.reduce(
      (sum, v) => sum + Number(v.total_ttc),
      0,
    );

    return {
      id: c.id_client,
      codeClient: c.code_client,
      nom: c.nom,
      prenom: c.prenom || '',
      nomComplet: c.prenom ? `${c.nom} ${c.prenom}` : c.nom,
      telephone: c.telephone || '',
      email: c.email || '',
      adresse: c.adresse || '',
      typeClient: c.type_client,
      notes: c.notes || '',
      dateCreation: c.date_creation,
      nombreVentes: validesVentes.length,
      totalAchats,
      ventes: c.ventes.map((v) => ({
        id: v.id_vente,
        referenceTicket: v.reference_ticket,
        numeroFacture: v.numero_facture,
        dateVente: v.date_vente,
        totalTtc: Number(v.total_ttc),
        totalRemise: Number(v.total_remise),
        statutVente: v.statut_vente,
        nbArticles: v.lignes.reduce((sum, l) => sum + l.quantite, 0),
        paiements: v.paiements.map((p) => ({
          modePaiement: p.mode_paiement,
          montant: Number(p.montant),
          datePaiement: p.date_paiement,
        })),
      })),
    };
  }

  async create(data: {
    nom: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
    typeClient?: string;
    notes?: string;
  }) {
    if (!data.nom || data.nom.trim() === '') {
      throw new BadRequestException('Le nom du client est obligatoire.');
    }

    const codeClient = await this.generateNextCodeClient();

    const client = await this.prisma.client.create({
      data: {
        code_client: codeClient,
        nom: data.nom.trim(),
        prenom: data.prenom ? data.prenom.trim() : null,
        telephone: data.telephone ? data.telephone.trim() : null,
        email: data.email ? data.email.trim() : null,
        adresse: data.adresse ? data.adresse.trim() : null,
        type_client: data.typeClient || 'PARTICULIER',
        notes: data.notes || null,
      },
    });

    return this.findOne(client.id_client);
  }

  async update(id: number, data: any) {
    const existing = await this.prisma.client.findUnique({
      where: { id_client: id },
    });
    if (!existing) throw new NotFoundException(`Client #${id} introuvable`);

    await this.prisma.client.update({
      where: { id_client: id },
      data: {
        ...(data.nom ? { nom: data.nom.trim() } : {}),
        ...(data.prenom !== undefined ? { prenom: data.prenom ? data.prenom.trim() : null } : {}),
        ...(data.telephone !== undefined ? { telephone: data.telephone ? data.telephone.trim() : null } : {}),
        ...(data.email !== undefined ? { email: data.email ? data.email.trim() : null } : {}),
        ...(data.adresse !== undefined ? { adresse: data.adresse ? data.adresse.trim() : null } : {}),
        ...(data.typeClient ? { type_client: data.typeClient } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const existing = await this.prisma.client.findUnique({
      where: { id_client: id },
    });
    if (!existing) throw new NotFoundException(`Client #${id} introuvable`);

    if (existing.code_client === 'CLI-0000') {
      throw new BadRequestException('Le client comptoir par défaut ne peut pas être supprimé.');
    }

    // Supprimer le client (les ventes associées auront id_client = null par cascade onDelete: SetNull)
    await this.prisma.client.delete({
      where: { id_client: id },
    });

    return { success: true, message: `Client ${existing.nom} supprimé avec succès.` };
  }
}
