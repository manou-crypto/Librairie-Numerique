import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/v1/clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Roles('ADMIN', 'CAISSIER', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async findAll(@Query('search') search?: string, @Query('typeClient') typeClient?: string) {
    return this.clientsService.findAll({ search, typeClient });
  }

  @Get(':id')
  @Roles('ADMIN', 'CAISSIER', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'CAISSIER', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async create(@Body() data: any) {
    return this.clientsService.create(data);
  }

  @Put(':id')
  @Roles('ADMIN', 'CAISSIER', 'GESTIONNAIRE_CATALOGUE')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.clientsService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.remove(id);
  }
}
