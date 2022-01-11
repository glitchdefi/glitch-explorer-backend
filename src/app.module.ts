import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from 'src/databases/Block.entity';
import { Log } from 'src/databases/Log.entity';
import { Transaction } from 'src/databases/Transaction.entity';
import { Address } from 'src/databases/Address.entity';
import { Event } from 'src/databases/Event.entity';
import { Extrinsic } from 'src/databases/Extrinsic.entity';
import { BalanceHistory } from 'src/databases/BalanceHistory.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      schema: process.env.DATABASE_SCHEMA || `public`,
      entities: [
        Block,
        Log,
        Transaction,
        Address,
        Event,
        Extrinsic,
        BalanceHistory,
      ],
      synchronize: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
