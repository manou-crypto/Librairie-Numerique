import { Module } from '@nestjs/common';
import { CaissesService } from './caisses.service';
import { CaissesController } from './caisses.controller';

@Module({
  controllers: [CaissesController],
  providers: [CaissesService],
  exports: [CaissesService],
})
export class CaissesModule {}
