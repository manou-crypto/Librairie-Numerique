import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('permissions')
  @Roles('ADMIN')
  async getPermissions() {
    return this.usersService.getPermissions();
  }

  @Get('roles')
  @Roles('ADMIN')
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Post('roles')
  @Roles('ADMIN')
  async createRole(@Body() data: { codeRole: string; libelle: string; permissions?: string[] }) {
    return this.usersService.createRole(data);
  }

  @Put('roles/:id')
  @Roles('ADMIN')
  async updateRole(@Param('id', ParseIntPipe) id: number, @Body() data: { libelle?: string; permissions?: string[] }) {
    return this.usersService.updateRole(id, data);
  }

  @Delete('roles/:id')
  @Roles('ADMIN')
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteRole(id);
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: { nom: string; prenom: string; email: string; password: string; codeRole: string }) {
    return this.usersService.create(data);
  }

  @Get('me/profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put('me/profile')
  // Pas de restriction de rôle, n'importe quel utilisateur connecté peut modifier son profil
  async updateProfile(@CurrentUser() user: any, @Body() data: { nom: string; prenom: string; email: string; telephone?: string; avatar_url?: string; avatarUrl?: string }) {
    return this.usersService.updateProfile(user.id, data);
  }

  @Put('me/password')
  async updatePassword(@CurrentUser() user: any, @Body() data: { actuel: string; nouveau: string }) {
    return this.usersService.updatePassword(user.id, data.actuel, data.nouveau);
  }

  @Put(':id')
  @Roles('ADMIN')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
