import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { CaissesService } from './caisses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CaissesController {
  constructor(private readonly caissesService: CaissesService) {}

  @Get('caisses')
  @Roles('ADMIN', 'CAISSIER', 'GESTIONNAIRE_CATALOGUE')
  async getCaisses() {
    return this.caissesService.getCaisses();
  }

  @Get('caisses/ma-caisse')
  @Roles('ADMIN', 'CAISSIER')
  async getMyCaisse(@CurrentUser() user: any) {
    return this.caissesService.getMyCaisse(user.id);
  }

  @Post('caisses')
  @Roles('ADMIN')
  async createCaisse(@Body() data: { codeCaisse: string; emplacement?: string; utilisateurId: number }) {
    return this.caissesService.createCaisse(data);
  }

  @Delete('caisses/:id')
  @Roles('ADMIN')
  async deleteCaisse(@Param('id', ParseIntPipe) id: number) {
    return this.caissesService.deleteCaisse(id);
  }

  @Patch('caisses/:id')
  @Roles('ADMIN')
  async updateCaisse(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { codeCaisse?: string; emplacement?: string; utilisateurId?: number | null },
  ) {
    return this.caissesService.updateCaisse(id, data);
  }

  @Get('sessions-caisse/active')
  @Roles('ADMIN', 'CAISSIER')
  async getActiveSession(@CurrentUser() user: any) {
    const session = await this.caissesService.getActiveSession(user.id);
    if (!session) {
      throw new NotFoundException('Aucune session active trouvée');
    }
    return session;
  }

  @Post('sessions-caisse/ouvrir')
  @Roles('ADMIN', 'CAISSIER')
  async ouvrirSession(@CurrentUser() user: any, @Body() data: any) {
    return this.caissesService.ouvrirSession(user.id, user.role, data);
  }

  @Post('sessions-caisse/:id/cloturer')
  @Roles('ADMIN', 'CAISSIER')
  @RequirePermissions('CLOTURER_CAISSE')
  async cloturerSession(@Param('id', ParseIntPipe) id: number) {
    return this.caissesService.cloturerSession(id);
  }

  @Get('sessions-caisse/historique')
  @Roles('ADMIN', 'CAISSIER')
  async getHistoriqueSessions() {
    return this.caissesService.getHistoriqueSessions();
  }

  @Get('sessions-caisse/:id/rapport')
  @Roles('ADMIN', 'CAISSIER')
  async getRapportSession(@Param('id', ParseIntPipe) id: number) {
    return this.caissesService.getRapportSession(id);
  }
}
