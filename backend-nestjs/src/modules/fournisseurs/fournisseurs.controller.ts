import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { FournisseursService } from './fournisseurs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/v1/fournisseurs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FournisseursController {
  constructor(private readonly fournisseursService: FournisseursService) {}

  @Get()
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async findAll() {
    return this.fournisseursService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fournisseursService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'ACHETEUR_STOCK')
  async create(@Body() data: any) {
    return this.fournisseursService.create(data);
  }

  @Put(':id')
  @Roles('ADMIN', 'ACHETEUR_STOCK')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.fournisseursService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.fournisseursService.remove(id);
  }
}
