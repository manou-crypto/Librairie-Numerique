import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CatalogueService } from './catalogue.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/v1')
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Get('produits')
  async findAll(@Query() query: any) {
    return this.catalogueService.findAll(query);
  }

  @Get('produits/code-barre/:code')
  async findByCodeBarre(@Param('code') code: string) {
    return this.catalogueService.findByCodeBarre(code);
  }

  @Get('produits/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalogueService.findOne(id);
  }

  @Get('categories')
  async getCategories() {
    return this.catalogueService.getCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async createCategory(@Body() data: any) {
    return this.catalogueService.createCategory(data);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async updateCategory(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.catalogueService.updateCategory(id, data);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.catalogueService.deleteCategory(id);
  }

  @Get('marques')
  async getMarques() {
    return this.catalogueService.getMarques();
  }

  @Post('marques')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async createMarque(@Body() data: { nom: string }) {
    return this.catalogueService.createMarque(data);
  }

  @Put('marques/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async updateMarque(@Param('id', ParseIntPipe) id: number, @Body() data: { nom: string }) {
    return this.catalogueService.updateMarque(id, data);
  }

  @Delete('marques/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async deleteMarque(@Param('id', ParseIntPipe) id: number) {
    return this.catalogueService.deleteMarque(id);
  }

  @Post('produits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async create(@Body() data: any) {
    return this.catalogueService.create(data);
  }

  @Put('produits/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.catalogueService.update(id, data);
  }

  @Patch('produits/:id/masquer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async masquer(@Param('id', ParseIntPipe) id: number) {
    return this.catalogueService.masquer(id);
  }

  @Delete('produits/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalogueService.remove(id);
  }

  @Post('produits/:id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async addImage(@Param('id', ParseIntPipe) id: number, @Body() data: { url: string; est_principale?: boolean }) {
    return this.catalogueService.addImage(id, data.url, data.est_principale);
  }

  @Delete('produits/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async removeImage(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.catalogueService.removeImage(imageId);
  }

  // --- Types de Vente ---
  @Get('types-vente')
  async getTypesVente() {
    return this.catalogueService.getTypesVente();
  }

  @Post('types-vente')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  @RequirePermissions('GERER_TARIFS')
  async createTypeVente(@Body() data: { libelle: string }) {
    return this.catalogueService.createTypeVente(data);
  }

  @Put('types-vente/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  @RequirePermissions('GERER_TARIFS')
  async updateTypeVente(@Param('id', ParseIntPipe) id: number, @Body() data: { libelle: string }) {
    return this.catalogueService.updateTypeVente(id, data);
  }

  @Delete('types-vente/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  @RequirePermissions('GERER_TARIFS')
  async deleteTypeVente(@Param('id', ParseIntPipe) id: number) {
    return this.catalogueService.deleteTypeVente(id);
  }
}
