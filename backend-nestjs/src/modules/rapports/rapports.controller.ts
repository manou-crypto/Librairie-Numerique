import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RapportsService } from './rapports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/v1/rapports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RapportsController {
  constructor(private readonly rapportsService: RapportsService) {}

  @Get('stats')
  @Roles('super_admin', 'manager')
  async getStats(@Query('period') period: string = 'semaine') {
    return this.rapportsService.getDashboardStats(period);
  }
}
