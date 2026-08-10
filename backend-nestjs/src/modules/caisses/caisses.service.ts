import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CaissesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.caisse.count();
      if (count === 0) {
        console.log('🏪 Initialisation des caisses par défaut (Caisse 1)...');
        await this.prisma.caisse.createMany({
          data: [
            { code_caisse: 'Caisse 1', emplacement: 'Comptoir Principal', statut_caisse: 'FERMEE' },
            { code_caisse: 'Caisse 2', emplacement: 'Comptoir Annexe', statut_caisse: 'FERMEE' },
          ],
        });
      }
    } catch (e: any) {
      console.warn('⚠️ Seed caisses ignoré.', e.message);
    }
  }

  async getCaisses() {
    const list = await this.prisma.caisse.findMany({ orderBy: { code_caisse: 'asc' } });
    return list.map((c) => ({
      id: String(c.id_caisse),
      codeCaisse: c.code_caisse,
      emplacement: c.emplacement || undefined,
      statutCaisse: c.statut_caisse,
    }));
  }

  async getActiveSession(userId: number) {
    const session = await this.prisma.sessionCaisse.findFirst({
      where: { id_utilisateur: userId, statut_session: 'OUVERTE' },
      include: { caisse: true, utilisateur: true },
    });

    if (!session) return null;

    return {
      id: String(session.id_session),
      caisseId: String(session.id_caisse),
      codeCaisse: session.caisse.code_caisse,
      utilisateurId: session.id_utilisateur,
      utilisateurNom: `${session.utilisateur.prenom} ${session.utilisateur.nom}`,
      dateOuverture: session.date_ouverture.toISOString(),
      fondDeCaisseInitial: Number(session.fond_de_caisse_initial),
      totalEncaisseCalcule: Number(session.total_encaisse_calcule),
      totalEncaisseReel: Number(session.total_encaisse_reel),
      ecartCaisse: Number(session.ecart_caisse),
      statutSession: session.statut_session,
    };
  }

  async ouvrirSession(userId: number, data: { caisseId?: string; fondDeCaisseInitial: number }) {
    const existing = await this.getActiveSession(userId);
    if (existing) {
      throw new BadRequestException('Une session de caisse est déjà ouverte pour cet utilisateur.');
    }

    let caisseIdNum = data.caisseId ? Number(data.caisseId) : 1;
    let caisse = await this.prisma.caisse.findUnique({ where: { id_caisse: caisseIdNum } });
    if (!caisse) {
      const firstCaisse = await this.prisma.caisse.findFirst();
      if (!firstCaisse) throw new NotFoundException('Aucune caisse enregistrée dans le système');
      caisseIdNum = firstCaisse.id_caisse;
      caisse = firstCaisse;
    }

    const session = await this.prisma.sessionCaisse.create({
      data: {
        id_caisse: caisseIdNum,
        id_utilisateur: userId,
        fond_de_caisse_initial: data.fondDeCaisseInitial,
        statut_session: 'OUVERTE',
      },
      include: { caisse: true, utilisateur: true },
    });

    await this.prisma.caisse.update({
      where: { id_caisse: caisseIdNum },
      data: { statut_caisse: 'OUVERTE' },
    });

    return {
      id: String(session.id_session),
      caisseId: String(session.id_caisse),
      codeCaisse: session.caisse.code_caisse,
      utilisateurId: session.id_utilisateur,
      utilisateurNom: `${session.utilisateur.prenom} ${session.utilisateur.nom}`,
      dateOuverture: session.date_ouverture.toISOString(),
      fondDeCaisseInitial: Number(session.fond_de_caisse_initial),
      totalEncaisseCalcule: 0,
      totalEncaisseReel: 0,
      ecartCaisse: 0,
      statutSession: session.statut_session,
    };
  }

  async cloturerSession(sessionId: number, data: { totalEncaisseReel: number; motifEcart?: string }) {
    const session = await this.prisma.sessionCaisse.findUnique({
      where: { id_session: sessionId },
    });

    if (!session || session.statut_session === 'CLOTUREE') {
      throw new BadRequestException('Session introuvable ou déjà clôturée.');
    }

    const totalCalcule = Number(session.total_encaisse_calcule);
    const totalReel = Number(data.totalEncaisseReel);
    const ecart = totalReel - totalCalcule;

    const updated = await this.prisma.sessionCaisse.update({
      where: { id_session: sessionId },
      data: {
        statut_session: 'CLOTUREE',
        date_cloture: new Date(),
        total_encaisse_reel: totalReel,
        ecart_caisse: ecart,
        motif_ecart: data.motifEcart || null,
      },
      include: { caisse: true, utilisateur: true },
    });

    await this.prisma.caisse.update({
      where: { id_caisse: session.id_caisse },
      data: { statut_caisse: 'FERMEE' },
    });

    return {
      id: String(updated.id_session),
      caisseId: String(updated.id_caisse),
      codeCaisse: updated.caisse.code_caisse,
      utilisateurNom: `${updated.utilisateur.prenom} ${updated.utilisateur.nom}`,
      dateCloture: updated.date_cloture?.toISOString(),
      totalEncaisseCalcule: Number(updated.total_encaisse_calcule),
      totalEncaisseReel: Number(updated.total_encaisse_reel),
      ecartCaisse: Number(updated.ecart_caisse),
      motifEcart: updated.motif_ecart || undefined,
      statutSession: updated.statut_session,
    };
  }
}
