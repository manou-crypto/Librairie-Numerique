import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../events/app.gateway';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConfigurationService {
  constructor(
    private prisma: PrismaService,
    private readonly gateway: AppGateway,
  ) {}

  async getConfiguration() {
    let config = await this.prisma.configuration.findUnique({
      where: { id_configuration: 1 },
    });

    if (!config) {
      config = await this.prisma.configuration.create({
        data: {
          id_configuration: 1,
          nom_librairie: 'LibrairieNumerique',
          devise: 'DZD',
          tva: new Prisma.Decimal(0),
        },
      });
    }
    
    return {
      ...config,
      tva: Number(config.tva),
    };
  }

  async updateConfiguration(data: {
    nom_librairie?: string;
    logo_url?: string;
    devise?: string;
    tva?: number;
  }) {
    const updateData: any = { ...data };
    if (data.tva !== undefined) {
      updateData.tva = new Prisma.Decimal(data.tva);
    }
    
    const config = await this.prisma.configuration.upsert({
      where: { id_configuration: 1 },
      update: updateData,
      create: {
        id_configuration: 1,
        nom_librairie: updateData.nom_librairie || 'LibrairieNumerique',
        devise: updateData.devise || 'DZD',
        tva: updateData.tva || new Prisma.Decimal(0),
        logo_url: updateData.logo_url,
      },
    });

    const result = {
      ...config,
      tva: Number(config.tva),
    };

    // 📡 Émettre la mise à jour en temps réel à tous les clients connectés.
    // Chaque navigateur ouvert sur l'application recevra instantanément la
    // nouvelle configuration sans avoir à rafraîchir la page.
    this.gateway.emitConfigUpdated(result);

    return result;
  }
}
