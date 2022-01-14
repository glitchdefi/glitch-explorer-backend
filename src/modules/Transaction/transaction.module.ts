import {
  BlockTransactionController,
  TransactionController,
} from './transaction.controller';
import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';
import { TransactionProviders } from './transaction.providers';
import { TransactionService } from './transaction.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TransactionController, BlockTransactionController],
  providers: [...TransactionProviders, TransactionService],
})
export class TransactionModule {}
