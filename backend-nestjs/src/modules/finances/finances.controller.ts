import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @Get('dashboard/kpi')
  @Roles('ADMIN', 'GESTIONNAIRE_CATALOGUE')
  async getDashboardKpis() {
    return this.financesService.getDashboardKpis();
  }

  @Post('finances/cloture-journaliere')
  @Roles('ADMIN')
  async effectuerClotureJournaliere(@CurrentUser() user: any, @Body('dateCloture') dateCloture: string) {
    return this.financesService.effectuerClotureJournaliere(user.id, dateCloture);
  }

  @Get('finances/clotures')
  @Roles('ADMIN')
  async getHistoriqueClotures() {
    return this.financesService.getHistoriqueClotures();
  }
}
