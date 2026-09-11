import { Module } from '@nestjs/common';
import { AchatsService } from './achats.service';
import { AchatsController } from './achats.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AchatsController],
  providers: [AchatsService],
  exports: [AchatsService],
})
export class AchatsModule {}
