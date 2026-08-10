import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CaissesService } from './caisses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CaissesController {
  constructor(private readonly caissesService: CaissesService) {}

  @Get('caisses')
  @Roles('ADMIN', 'CAISSIER', 'GESTIONNAIRE_CATALOGUE')
  async getCaisses() {
    return this.caissesService.getCaisses();
  }

  @Get('sessions-caisse/active')
  @Roles('ADMIN', 'CAISSIER')
  async getActiveSession(@CurrentUser() user: any) {
    return this.caissesService.getActiveSession(user.id);
  }

  @Post('sessions-caisse/ouvrir')
  @Roles('ADMIN', 'CAISSIER')
  async ouvrirSession(@CurrentUser() user: any, @Body() data: any) {
    return this.caissesService.ouvrirSession(user.id, data);
  }

  @Post('sessions-caisse/:id/cloturer')
  @Roles('ADMIN', 'CAISSIER')
  async cloturerSession(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.caissesService.cloturerSession(id, data);
  }
}
