import { BlockProviders } from '../block/block.providers';
import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { TransactionProviders } from '../transaction/transaction.providers';

@Module({
  imports: [DatabaseModule],
  providers: [
    ...BlockProviders,
    ...TransactionProviders,
    SocketService,
    SocketGateway,
  ],
})
export class SocketModule {}
