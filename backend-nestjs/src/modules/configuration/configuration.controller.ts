import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api/v1/configuration')
export class ConfigurationController {
  constructor(private readonly configService: ConfigurationService) {}

  @Get()
  getConfiguration() {
    return this.configService.getConfiguration();
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  updateConfiguration(@Body() data: any) {
    return this.configService.updateConfiguration(data);
  }
}
