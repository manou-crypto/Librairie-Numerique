import { Module } from '@nestjs/common';
import { RapportsService } from './rapports.service';
import { RapportsController } from './rapports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RapportsController],
  providers: [RapportsService]
})
export class RapportsModule {}
