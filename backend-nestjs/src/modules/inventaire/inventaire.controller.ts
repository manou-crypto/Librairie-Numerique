import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { InventaireService } from './inventaire.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/inventaires')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventaireController {
  constructor(private readonly inventaireService: InventaireService) {}

  @Get()
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async findAll() {
    return this.inventaireService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventaireService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async create(@CurrentUser() user: any, @Body() data: any) {
    return this.inventaireService.create(user.id, data);
  }

  @Post(':id')
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async update(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any, @Body() data: any) {
    return this.inventaireService.update(id, user.id, data);
  }

  @Post(':id/valider')
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async valider(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.inventaireService.valider(id, user.id);
  }
}
