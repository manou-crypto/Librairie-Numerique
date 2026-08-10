import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { VentesService } from './ventes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/ventes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VentesController {
  constructor(private readonly ventesService: VentesService) {}

  @Post()
  @Roles('ADMIN', 'CAISSIER')
  async createVente(@CurrentUser() user: any, @Body() payload: any) {
    return this.ventesService.createVente(user.id, payload);
  }

  @Get()
  @Roles('ADMIN', 'CAISSIER', 'GESTIONNAIRE_CATALOGUE')
  async getVentes(@Query() query: any) {
    return this.ventesService.getVentes(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'CAISSIER', 'GESTIONNAIRE_CATALOGUE')
  async getVenteById(@Param('id', ParseIntPipe) id: number) {
    return this.ventesService.getVenteById(id);
  }

  @Patch(':id/annuler')
  @Roles('ADMIN')
  async annulerVente(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any, @Body('motif') motif?: string) {
    return this.ventesService.annulerVente(id, user.id, motif);
  }
}
