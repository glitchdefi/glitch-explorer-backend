import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockModule } from './modules/block/block.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { LogModule } from './modules/log/log.module';

@Module({
  imports: [ConfigModule.forRoot(), BlockModule, TransactionModule, LogModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
