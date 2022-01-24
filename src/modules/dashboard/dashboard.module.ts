import { DashboardController } from './dashboard.controller';
import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';
import { DashboardProviders } from './dashboard.providers';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController],
  providers: [...DashboardProviders, DashboardService],
})
export class DashboardModule {}
