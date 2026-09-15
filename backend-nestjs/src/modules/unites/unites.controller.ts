import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { UnitesService } from './unites.service';
import { RequirePermissions } from '../../common/guards/permissions.guard';

@Controller('api/v1/unites')
export class UnitesController {
  constructor(private readonly unitesService: UnitesService) {}

  @Post()
  @RequirePermissions('GERER_UNITES')
  create(@Body() createUniteDto: any) {
    return this.unitesService.create(createUniteDto);
  }

  @Get()
  findAll() {
    return this.unitesService.findAll();
  }

  @Put(':id')
  @RequirePermissions('GERER_UNITES')
  update(@Param('id') id: string, @Body() updateUniteDto: any) {
    return this.unitesService.update(+id, updateUniteDto);
  }

  @Delete(':id')
  @RequirePermissions('GERER_UNITES')
  remove(@Param('id') id: string) {
    return this.unitesService.remove(+id);
  }
}
