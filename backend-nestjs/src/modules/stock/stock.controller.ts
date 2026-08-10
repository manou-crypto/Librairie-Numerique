import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async findAll(@Query() query: any) {
    return this.stockService.findAll(query);
  }

  @Post('mouvements')
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async ajusterStock(@CurrentUser() user: any, @Body() data: any) {
    return this.stockService.ajusterStock(user.id, data);
  }

  @Get('mouvements')
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE', 'ACHETEUR_STOCK')
  async getMouvements(@Query('produitId') produitId?: string) {
    return this.stockService.getMouvements(produitId);
  }
}
