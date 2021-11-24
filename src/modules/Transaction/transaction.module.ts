import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from 'src/databases/Transactions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transactions])],
  controllers: [],
  providers: [],
})
export class TransactionModule {}
