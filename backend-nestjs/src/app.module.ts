import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { StockModule } from './modules/stock/stock.module';
import { FournisseursModule } from './modules/fournisseurs/fournisseurs.module';
import { AchatsModule } from './modules/achats/achats.module';
import { CaissesModule } from './modules/caisses/caisses.module';
import { VentesModule } from './modules/ventes/ventes.module';
import { InventaireModule } from './modules/inventaire/inventaire.module';
import { FinancesModule } from './modules/finances/finances.module';
import { ConfigurationModule } from './modules/configuration/configuration.module';
import { EventsModule } from './modules/events/events.module';

import { NotificationsModule } from './modules/notifications/notifications.module';
import { RapportsModule } from './modules/rapports/rapports.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    EventsModule, // Doit être importé EN PREMIER car il est @Global()
    AuthModule,
    UsersModule,
    CatalogueModule,
    StockModule,
    FournisseursModule,
    AchatsModule,
    CaissesModule,
    VentesModule,
    InventaireModule,
    FinancesModule,
    ConfigurationModule,
    NotificationsModule,
    RapportsModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

