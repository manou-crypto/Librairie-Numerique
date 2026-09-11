import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AchatsService } from './achats.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/achats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AchatsController {
  constructor(private readonly achatsService: AchatsService) {}

  @Get()
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async findAll() {
    return this.achatsService.findAll();
  }

  @Get('en-retard')
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async findEnRetard(@Query('seuil') seuil?: string) {
    return this.achatsService.findEnRetard(seuil ? parseInt(seuil) : 7);
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.achatsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'ACHETEUR_STOCK')
  async create(@CurrentUser() user: any, @Body() data: any) {
    return this.achatsService.create(user.id, data);
  }

  @Post(':id/reception')
  @Roles('ADMIN', 'ACHETEUR_STOCK')
  async validerReception(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any, @Body() data: any) {
    return this.achatsService.validerReception(id, user.id, data);
  }

  @Patch(':id/annuler')
  @Roles('ADMIN', 'ACHETEUR_STOCK')
  async annuler(@Param('id', ParseIntPipe) id: number) {
    return this.achatsService.annuler(id);
  }
}
