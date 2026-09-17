import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class UnitesService {
  async create(createUniteDto: any) {
    return prisma.unite.create({
      data: {
        nom: createUniteDto.nom,
        description: createUniteDto.description,
        multiple: createUniteDto.multiple,
        id_unite_base: createUniteDto.id_unite_base || null,
      },
    });
  }

  async findAll() {
    return prisma.unite.findMany({
      orderBy: { multiple: 'asc' },
    });
  }

  async update(id: number, updateUniteDto: any) {
    const existing = await prisma.unite.findUnique({ where: { id_unite: id } });
    if (!existing) throw new NotFoundException('Unité non trouvée');

    return prisma.unite.update({
      where: { id_unite: id },
      data: {
        nom: updateUniteDto.nom,
        description: updateUniteDto.description,
        multiple: updateUniteDto.multiple,
        id_unite_base: updateUniteDto.id_unite_base !== undefined ? updateUniteDto.id_unite_base : existing.id_unite_base,
      },
    });
  }

  async remove(id: number) {
    const existing = await prisma.unite.findUnique({ where: { id_unite: id } });
    if (!existing) throw new NotFoundException('Unité non trouvée');

    return prisma.unite.delete({
      where: { id_unite: id },
    });
  }
}
