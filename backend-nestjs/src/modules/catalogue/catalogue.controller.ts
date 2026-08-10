import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CatalogueService } from './catalogue.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
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
}
