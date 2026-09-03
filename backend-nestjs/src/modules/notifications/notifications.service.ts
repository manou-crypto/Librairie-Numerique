import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.notification.findMany({
      orderBy: { date_creation: 'desc' },
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: { id_notification: id },
      data: { lue: true },
    });
  }

  async markAllAsRead() {
    return this.prisma.notification.updateMany({
      where: { lue: false },
      data: { lue: true },
    });
  }

  async remove(id: number) {
    return this.prisma.notification.delete({
      where: { id_notification: id },
    });
  }

  async removeAll() {
    return this.prisma.notification.deleteMany();
  }

  // Méthode interne pour créer des notifications depuis d'autres modules (ex: stock)
  async createNotification(type: string, titre: string, message: string) {
    return this.prisma.notification.create({
      data: {
        type,
        titre,
        message,
        lue: false,
      },
    });
  }
}
