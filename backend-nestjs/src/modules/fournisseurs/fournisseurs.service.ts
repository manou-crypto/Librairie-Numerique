import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FournisseursService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const list = await this.prisma.fournisseur.findMany({
      orderBy: { nom_entreprise: 'asc' },
    });
    return list.map((f) => ({
      id: String(f.id_fournisseur),
      typeFournisseur: f.type_fournisseur,
      nomEntreprise: f.nom_entreprise,
      prenom: f.prenom || undefined,
      contactNom: f.contact_nom || undefined,
      telephone: f.telephone || undefined,
      email: f.email || undefined,
      adresse: f.adresse || undefined,
      ville: f.ville || undefined,
      pays: f.pays || undefined,
      numeroContribuable: f.numero_contribuable || undefined,
      observations: f.observations || undefined,
    }));
  }

  async findOne(id: number) {
    const f = await this.prisma.fournisseur.findUnique({
      where: { id_fournisseur: id },
    });
    if (!f) throw new NotFoundException(`Fournisseur #${id} introuvable`);
    return {
      id: String(f.id_fournisseur),
      typeFournisseur: f.type_fournisseur,
      nomEntreprise: f.nom_entreprise,
      prenom: f.prenom || undefined,
      contactNom: f.contact_nom || undefined,
      telephone: f.telephone || undefined,
      email: f.email || undefined,
      adresse: f.adresse || undefined,
      ville: f.ville || undefined,
      pays: f.pays || undefined,
      numeroContribuable: f.numero_contribuable || undefined,
      observations: f.observations || undefined,
    };
  }

  async create(data: any) {
    const f = await this.prisma.fournisseur.create({
      data: {
        type_fournisseur: data.typeFournisseur || 'SOCIETE',
        nom_entreprise: data.nomEntreprise,
        prenom: data.prenom || null,
        contact_nom: data.contactNom || null,
        telephone: data.telephone || null,
        email: data.email || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        pays: data.pays || "Côte d'Ivoire",
        numero_contribuable: data.numeroContribuable || null,
        observations: data.observations || null,
      },
    });
    return this.findOne(f.id_fournisseur);
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    await this.prisma.fournisseur.update({
      where: { id_fournisseur: id },
      data: {
        ...(data.typeFournisseur ? { type_fournisseur: data.typeFournisseur } : {}),
        ...(data.nomEntreprise ? { nom_entreprise: data.nomEntreprise } : {}),
        ...(data.prenom !== undefined ? { prenom: data.prenom } : {}),
        ...(data.contactNom !== undefined ? { contact_nom: data.contactNom } : {}),
        ...(data.telephone !== undefined ? { telephone: data.telephone } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.adresse !== undefined ? { adresse: data.adresse } : {}),
        ...(data.ville !== undefined ? { ville: data.ville } : {}),
        ...(data.pays !== undefined ? { pays: data.pays } : {}),
        ...(data.numeroContribuable !== undefined ? { numero_contribuable: data.numeroContribuable } : {}),
        ...(data.observations !== undefined ? { observations: data.observations } : {}),
      },
    });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.fournisseur.delete({ where: { id_fournisseur: id } });
  }
}
