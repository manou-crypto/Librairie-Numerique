import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * AppGateway — Point central de tous les événements WebSocket temps réel.
 *
 * Événements émis vers les clients (server -> clients) :
 *  - 'config_updated'   : Paramètres globaux (nom librairie, devise, tva, logo) modifiés
 *  - 'sale_completed'   : Nouvelle vente validée (payload: données KPI incrémentales)
 *  - 'sale_cancelled'   : Vente annulée
 *  - 'stock_updated'    : Niveau de stock d'un produit modifié (alerte/rupture)
 *  - 'kpi_update'       : Données KPI fraîches du tableau de bord
 *
 * Le gateway écoute sur le même port que le serveur HTTP (port 3000),
 * avec le path '/ws' pour différencier du trafic HTTP normal.
 * CORS est ouvert sur toutes les origines pour permettre le proxy Nginx.
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  path: '/ws/socket.io',
  transports: ['websocket', 'polling'],
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);
  private connectedClients = 0;

  afterInit(server: Server) {
    this.logger.log('🔌 WebSocket Gateway initialisée avec succès');
  }

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(
      `✅ Client connecté: ${client.id} | Total: ${this.connectedClients}`,
    );
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(
      `❌ Client déconnecté: ${client.id} | Total: ${this.connectedClients}`,
    );
  }

  /**
   * Émet la configuration globale mise à jour à TOUS les clients connectés.
   * Appelé par ConfigurationService après chaque PUT.
   */
  emitConfigUpdated(config: {
    nom_librairie: string;
    logo_url: string | null;
    devise: string;
    tva: number;
  }) {
    this.logger.log(`📡 Émission config_updated → ${this.connectedClients} clients`);
    this.server.emit('config_updated', config);
  }

  /**
   * Émet l'événement de nouvelle vente validée à TOUS les clients.
   * Appelé par VentesService après chaque validation réussie.
   */
  emitSaleCompleted(saleData: {
    id: string;
    referenceTicket: string;
    totalTtc: number;
    totalHt: number;
    totalTva: number;
    margeTotale: number;
    dateVente: string;
    lignesCount: number;
  }) {
    this.logger.log(`📡 Émission sale_completed → ticket: ${saleData.referenceTicket}`);
    this.server.emit('sale_completed', saleData);
  }

  /**
   * Émet l'événement d'annulation de vente à tous les clients.
   */
  emitSaleCancelled(saleId: string) {
    this.logger.log(`📡 Émission sale_cancelled → vente #${saleId}`);
    this.server.emit('sale_cancelled', { id: saleId });
  }

  /**
   * Émet une mise à jour de stock pour un produit spécifique.
   * Appelé lors de chaque mouvement de stock (vente, achat, ajustement).
   * Les clients peuvent utiliser cet événement pour afficher des alertes de rupture.
   */
  emitStockUpdated(stockData: {
    produitId: string;
    produitLibelle: string;
    nouvelleQuantite: number;
    seuilAlerte: number;
    estEnAlerte: boolean;
    estEnRupture: boolean;
  }) {
    this.logger.log(
      `📡 Émission stock_updated → ${stockData.produitLibelle}: ${stockData.nouvelleQuantite} unités`,
    );
    this.server.emit('stock_updated', stockData);
  }

  /**
   * Émet un payload KPI complet pour forcer le rafraîchissement du Dashboard.
   * Peut être appelé suite à une vente ou à un calcul de clôture.
   */
  emitKpiUpdate(kpiData: {
    caJour: number;
    beneficeBrutJour: number;
    ventesJourCount: number;
    panierMoyen: number;
    caMoisTotal: number;
    rupturesStockCount: number;
  }) {
    this.logger.log(`📡 Émission kpi_update → CA jour: ${kpiData.caJour}`);
    this.server.emit('kpi_update', kpiData);
  }
}
