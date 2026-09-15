import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CaissesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}


  // ─── Créer une nouvelle caisse ────────────────────────────────────────────
  async createCaisse(data: { codeCaisse: string; emplacement?: string; utilisateurId: number }) {
    // Vérifier que le code n'existe pas déjà
    const existing = await this.prisma.caisse.findUnique({ where: { code_caisse: data.codeCaisse } });
    if (existing) {
      throw new BadRequestException(`Une caisse avec le code "${data.codeCaisse}" existe déjà.`);
    }

    if (!data.utilisateurId) {
      throw new BadRequestException('Un utilisateur doit être assigné à la caisse.');
    }

    // Vérifier que l'utilisateur existe
    const user = await this.prisma.utilisateur.findUnique({ where: { id_utilisateur: data.utilisateurId } });
    if (!user) {
      throw new NotFoundException(`Utilisateur #${data.utilisateurId} introuvable.`);
    }

    // Vérifier que l'utilisateur n'est pas déjà assigné à une caisse active
    const alreadyAssigned = await this.prisma.caisse.findFirst({ where: { id_utilisateur: data.utilisateurId, est_active: true } });
    if (alreadyAssigned) {
      throw new BadRequestException(`Cet utilisateur est déjà assigné à la caisse "${alreadyAssigned.code_caisse}".`);
    }

    const caisse = await this.prisma.caisse.create({
      data: {
        code_caisse: data.codeCaisse,
        emplacement: data.emplacement || null,
        statut_caisse: 'FERMEE',
        id_utilisateur: data.utilisateurId,
      },
      include: { utilisateur: true },
    });

    return {
      id: String(caisse.id_caisse),
      codeCaisse: caisse.code_caisse,
      emplacement: caisse.emplacement || undefined,
      statutCaisse: caisse.statut_caisse,
      caissier: caisse.utilisateur ? `${caisse.utilisateur.prenom} ${caisse.utilisateur.nom}` : undefined,
      totalVentes: 0,
      nbTransactions: 0,
    };
  }

  // ─── Mettre à jour une caisse (nom, emplacement, utilisateur) ───────────────
  async updateCaisse(
    id: number,
    data: { codeCaisse?: string; emplacement?: string; utilisateurId?: number | null },
  ) {
    const caisse = await this.prisma.caisse.findUnique({ where: { id_caisse: id } });
    if (!caisse) {
      throw new NotFoundException(`Caisse #${id} introuvable.`);
    }
    if (!caisse.est_active) {
      throw new BadRequestException('Impossible de modifier une caisse désactivée.');
    }

    // Vérifier unicité du nouveau code_caisse si fourni et différent de l'actuel
    if (data.codeCaisse && data.codeCaisse !== caisse.code_caisse) {
      const existing = await this.prisma.caisse.findUnique({ where: { code_caisse: data.codeCaisse } });
      if (existing) {
        throw new BadRequestException(`Une caisse avec le code "${data.codeCaisse}" existe déjà.`);
      }
    }

    // Vérifier que le nouvel utilisateur existe et n'est pas déjà sur une autre caisse
    if (data.utilisateurId !== undefined && data.utilisateurId !== null) {
      const user = await this.prisma.utilisateur.findUnique({ where: { id_utilisateur: data.utilisateurId } });
      if (!user) {
        throw new NotFoundException(`Utilisateur #${data.utilisateurId} introuvable.`);
      }
      const alreadyAssigned = await this.prisma.caisse.findFirst({
        where: {
          id_utilisateur: data.utilisateurId,
          est_active: true,
          NOT: { id_caisse: id }, // exclure la caisse en cours de modification
        },
      });
      if (alreadyAssigned) {
        throw new BadRequestException(
          `Cet utilisateur est déjà assigné à la caisse "${alreadyAssigned.code_caisse}".`,
        );
      }
    }

    const updated = await this.prisma.caisse.update({
      where: { id_caisse: id },
      data: {
        ...(data.codeCaisse   !== undefined && { code_caisse:    data.codeCaisse }),
        ...(data.emplacement  !== undefined && { emplacement:    data.emplacement }),
        // null = désassigner l'utilisateur ; undefined = ne pas toucher au champ
        ...(data.utilisateurId !== undefined && { id_utilisateur: data.utilisateurId }),
      },
      include: { utilisateur: true },
    });

    return {
      id: String(updated.id_caisse),
      codeCaisse: updated.code_caisse,
      emplacement: updated.emplacement || undefined,
      statutCaisse: updated.statut_caisse,
      caissier: updated.utilisateur
        ? `${updated.utilisateur.prenom} ${updated.utilisateur.nom}`
        : undefined,
      utilisateurId: updated.id_utilisateur ? String(updated.id_utilisateur) : undefined,
    };
  }

  // ─── Supprimer une caisse ──────────────────────────────────────────────────
  async deleteCaisse(id: number) {
    const caisse = await this.prisma.caisse.findUnique({
      where: { id_caisse: id },
      include: { sessions: true }
    });

    if (!caisse) {
      throw new NotFoundException(`Caisse #${id} introuvable.`);
    }

    if (caisse.statut_caisse === 'OUVERTE') {
      throw new BadRequestException("Impossible de supprimer une caisse actuellement ouverte.");
    }

    // Soft delete : on désactive la caisse et on libère l'utilisateur
    await this.prisma.caisse.update({
      where: { id_caisse: id },
      data: { 
        est_active: false,
        id_utilisateur: null
      }
    });
    
    return { success: true, message: `Caisse ${caisse.code_caisse} supprimée avec succès.` };
  }

  // ─── Lister les caisses ────────────────────────────────────────────────────
  async getCaisses() {
    const list = await this.prisma.caisse.findMany({ 
      where: { est_active: true },
      orderBy: { code_caisse: 'asc' },
      include: {
        utilisateur: true,
        sessions: {
          where: { statut_session: 'OUVERTE' },
          include: {
            utilisateur: true,
            ventes: { select: { id_vente: true } }
          }
        }
      }
    });
    return list.map((c) => {
      const activeSession = c.sessions[0];
      // Le caissier affiché est celui de la session active, sinon l'utilisateur assigné à la caisse
      const caissierNom = activeSession
        ? `${activeSession.utilisateur.prenom} ${activeSession.utilisateur.nom}`
        : c.utilisateur
          ? `${c.utilisateur.prenom} ${c.utilisateur.nom}`
          : undefined;
      return {
        id: String(c.id_caisse),
        codeCaisse: c.code_caisse,
        emplacement: c.emplacement || undefined,
        statutCaisse: c.statut_caisse,
        caissier: caissierNom,
        utilisateurId: c.id_utilisateur ? String(c.id_utilisateur) : undefined,
        totalVentes: activeSession ? Number(activeSession.total_encaisse_calcule) : 0,
        nbTransactions: activeSession ? activeSession.ventes.length : 0,
        heureOuverture: activeSession ? activeSession.date_ouverture.toISOString() : undefined,
        sessionId: activeSession ? String(activeSession.id_session) : undefined,
      };
    });
  }

  // ─── Caisse assignée à l'utilisateur ───────────────────────────────────────
  async getMyCaisse(userId: number) {
    const caisse = await this.prisma.caisse.findFirst({
      where: { id_utilisateur: userId, est_active: true },
    });

    if (!caisse) return null;

    return {
      id: String(caisse.id_caisse),
      codeCaisse: caisse.code_caisse,
      emplacement: caisse.emplacement || undefined,
      statutCaisse: caisse.statut_caisse,
      utilisateurId: caisse.id_utilisateur ? String(caisse.id_utilisateur) : undefined,
    };
  }

  // ─── Session active de l'utilisateur ───────────────────────────────────────
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

  // ─── Ouvrir une session de caisse ──────────────────────────────────────────
  async ouvrirSession(userId: number, userRole: string, data: { caisseId?: string; fondDeCaisseInitial: number }) {
    const existing = await this.getActiveSession(userId);
    if (existing) {
      throw new BadRequestException('Une session de caisse est déjà ouverte pour cet utilisateur.');
    }

    let caisseIdNum: number;
    let caisse: any;

    if (userRole === 'ADMIN') {
      caisseIdNum = data.caisseId ? Number(data.caisseId) : 1;
      caisse = await this.prisma.caisse.findUnique({ where: { id_caisse: caisseIdNum } });
      if (!caisse) {
        const firstCaisse = await this.prisma.caisse.findFirst();
        if (!firstCaisse) throw new NotFoundException('Aucune caisse enregistrée dans le système');
        caisseIdNum = firstCaisse.id_caisse;
        caisse = firstCaisse;
      }
    } else {
      // Pour les caissiers, l'assignation est obligatoire
      const caisseAssigned = await this.prisma.caisse.findFirst({
        where: { id_utilisateur: userId, est_active: true },
      });
      if (!caisseAssigned) {
        throw new BadRequestException("Aucune caisse ne vous est assignée. Veuillez contacter un administrateur.");
      }
      if (data.caisseId && caisseAssigned.id_caisse !== Number(data.caisseId)) {
        throw new BadRequestException("Vous n'êtes pas autorisé à ouvrir cette caisse.");
      }
      caisseIdNum = caisseAssigned.id_caisse;
      caisse = caisseAssigned;
    }

    if (caisse.statut_caisse === 'OUVERTE') {
      throw new BadRequestException('Cette caisse est déjà ouverte par un autre utilisateur.');
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

  // ─── Clôturer une session de caisse ────────────────────────────────────────
  async cloturerSession(sessionId: number) {
    const session = await this.prisma.sessionCaisse.findUnique({
      where: { id_session: sessionId },
    });

    if (!session || session.statut_session === 'CLOTUREE') {
      throw new BadRequestException('Session introuvable ou déjà clôturée.');
    }

    const totalCalcule = Number(session.total_encaisse_calcule);
    // Plus de saisie manuelle requise, le réel = calculé
    const totalReel = totalCalcule;
    const ecart = 0;

    const updated = await this.prisma.sessionCaisse.update({
      where: { id_session: sessionId },
      data: {
        statut_session: 'CLOTUREE',
        date_cloture: new Date(),
        total_encaisse_reel: totalReel,
        ecart_caisse: ecart,
        motif_ecart: null,
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
      statutSession: updated.statut_session,
    };
  }

  // ─── Rapport détaillé de session de caisse ───────────────────────────────
  async getRapportSession(sessionId: number) {
    const session = await this.prisma.sessionCaisse.findUnique({
      where: { id_session: sessionId },
      include: {
        caisse: true,
        utilisateur: true,
        ventes: {
          include: {
            lignes: {
              include: { produit: { include: { marque_rel: true } } }
            },
            paiements: true,
            retours: {
              include: { lignes: true }
            }
          }
        },
        retours: {
          include: { lignes: true }
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Session de caisse introuvable');
    }

    // 1. Résumé du tiroir-caisse
    let especesRecuesVentes = 0;
    let especesRecuesPaiementDu = 0; // Si on gère le crédit
    let remboursementsEspeces = 0;

    // 2. Résumé des ventes
    let ventesBrutesTotal = 0;
    let totalRemboursements = 0;

    // 3. Paiements encaissés
    const paiementsParMode: Record<string, number> = {};

    // 4. Créances
    let totalEnCaisse = 0;
    
    // 5. Détails produits
    const produitsVendus: Record<string, { sku: string, produit: string, quantite: number, montantTotal: number }> = {};
    const produitsParMarque: Record<string, { marque: string, quantite: number, montantTotal: number }> = {};

    // Parcourir les ventes de la session
    session.ventes.forEach(vente => {
      if (vente.statut_vente !== 'ANNULEE') {
        const totalVente = Number(vente.total_ttc);
        ventesBrutesTotal += totalVente;
        
        let totalPaiementsVente = 0;
        
        vente.paiements.forEach(paiement => {
          const montant = Number(paiement.montant);
          totalPaiementsVente += montant;
          totalEnCaisse += montant;
          
          if (paiement.mode_paiement === 'ESPECES') {
            especesRecuesVentes += montant;
          }
          
          paiementsParMode[paiement.mode_paiement] = (paiementsParMode[paiement.mode_paiement] || 0) + montant;
        });

        // Produits vendus
        vente.lignes.forEach(ligne => {
          const sku = ligne.produit.reference;
          const nom = ligne.nom_kit ? ligne.nom_kit : ligne.produit.libelle;
          const marque = ligne.produit.marque_rel ? ligne.produit.marque_rel.nom : 'Sans Marque';
          const qty = ligne.quantite;
          // on utilise le total TTC ou HT ? Disons TTC pour le rapport client
          const totalLigneTTC = Number(ligne.total_ligne_ht) * (1 + Number(ligne.taux_tva_snapshot)/100);

          if (!produitsVendus[sku]) {
            produitsVendus[sku] = { sku, produit: nom, quantite: 0, montantTotal: 0 };
          }
          produitsVendus[sku].quantite += qty;
          produitsVendus[sku].montantTotal += totalLigneTTC;

          if (!produitsParMarque[marque]) {
            produitsParMarque[marque] = { marque, quantite: 0, montantTotal: 0 };
          }
          produitsParMarque[marque].quantite += qty;
          produitsParMarque[marque].montantTotal += totalLigneTTC;
        });
      }
    });

    // Parcourir les retours
    session.retours.forEach(retour => {
      const montant = Number(retour.montant_rembourse);
      totalRemboursements += montant;
      if (retour.mode_remboursement === 'ESPECES') {
        remboursementsEspeces += montant;
      }
    });

    const ventesNettes = ventesBrutesTotal - totalRemboursements;
    const especesAttendues = Number(session.fond_de_caisse_initial) + especesRecuesVentes + especesRecuesPaiementDu - remboursementsEspeces;
    const enAttenteClients = ventesBrutesTotal - totalEnCaisse;

    return {
      session: {
        id: session.id_session,
        dateOuverture: session.date_ouverture.toISOString(),
        dateCloture: session.date_cloture?.toISOString(),
        utilisateur: `${session.utilisateur.prenom} ${session.utilisateur.nom}`,
        email: session.utilisateur.email,
        emplacement: session.caisse.emplacement || 'Non défini',
      },
      tiroirCaisse: {
        soldeOuverture: Number(session.fond_de_caisse_initial),
        especesRecuesVentes,
        especesRecuesPaiementDu,
        remboursementsEspeces,
        depensesEspeces: 0, // A ajouter si géré plus tard
        especesAttendues
      },
      resumeVentes: {
        ventesBrutes: ventesBrutesTotal,
        totalRemboursements,
        ventesNettes
      },
      paiements: Object.keys(paiementsParMode).map(mode => ({ mode, montant: paiementsParMode[mode] })),
      creances: {
        ventesBrutes: ventesBrutesTotal,
        totalEncaisse: totalEnCaisse,
        dusEncaisses: especesRecuesPaiementDu, // Approximation
        enAttenteClients: enAttenteClients > 0 ? enAttenteClients : 0
      },
      produits: Object.values(produitsVendus),
      marques: Object.values(produitsParMarque)
    };
  }
}
