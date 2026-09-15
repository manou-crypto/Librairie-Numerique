import { Module } from '@nestjs/common';
import { UnitesService } from './unites.service';
import { UnitesController } from './unites.controller';

@Module({
  controllers: [UnitesController],
  providers: [UnitesService],
})
export class UnitesModule {}
