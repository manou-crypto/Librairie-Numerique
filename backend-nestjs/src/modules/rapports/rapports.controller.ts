import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RapportsService } from './rapports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';

@Controller('api/v1/rapports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RapportsController {
  constructor(private readonly rapportsService: RapportsService) {}

  @Get('stats')
  @RequirePermissions('VIEW_RAPPORTS', 'VIEW_DASHBOARD')
  async getStats(@Query('period') period: string = 'semaine') {
    return this.rapportsService.getDashboardStats(period);
  }
}
