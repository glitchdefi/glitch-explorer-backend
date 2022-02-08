import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BlockModule } from './modules/block/block.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { LogModule } from './modules/log/log.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AddressModule } from './modules/address/address.module';
import { SearchModule } from './modules/search/search.module';
import { SocketModule } from './modules/socket/socket.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    BlockModule,
    TransactionModule,
    LogModule,
    DashboardModule,
    AddressModule,
    SearchModule,
    SocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
