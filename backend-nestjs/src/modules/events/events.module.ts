import { Module, Global } from '@nestjs/common';
import { AppGateway } from './app.gateway';

/**
 * EventsModule — Module Global qui expose AppGateway à TOUS les autres modules.
 * 
 * Le décorateur @Global() est intentionnel : il permet à n'importe quel service
 * (VentesService, ConfigurationService, StockService...) d'injecter AppGateway
 * sans avoir à importer EventsModule dans chaque module consommateur.
 * 
 * C'est le pattern recommandé pour les services d'infrastructure transversaux.
 */
@Global()
@Module({
  providers: [AppGateway],
  exports: [AppGateway],
})
export class EventsModule {}
