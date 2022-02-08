import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import {
  clearIntervalAsync,
  setIntervalAsync,
} from 'set-interval-async/dynamic';

import { SchedulerRegistry } from '@nestjs/schedule';
import { Socket } from 'socket.io';
import { SocketService } from './socket.service';

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private socketService: SocketService,
  ) {}

  handleConnection(client: Socket) {
    let previousBlock;
    let previousTx;
    const callback = async () => {
      const blockCount = await this.socketService.getBlockCount();
      const txCount = await this.socketService.getTxCount();

      if (!previousBlock) previousBlock = blockCount;
      if (!previousTx) previousTx = txCount;

      client.emit('headBlockLastest', blockCount);
      client.emit('headTxLatest', txCount);

      if (blockCount > previousBlock) {
        client.emit('blockLastest', await this.socketService.getBlockLastest());
        previousBlock = blockCount;
      }

      if (txCount > previousTx) {
        client.emit('txLastest', await this.socketService.getTxLastest());
        previousTx = txCount;
      }

      await new Promise((r) => setTimeout(r, 3000));
    };

    const interval = setIntervalAsync(callback, 3000);
    this.schedulerRegistry.addInterval(client.id, interval);
  }

  handleDisconnect(client: Socket) {
    const interval = this.schedulerRegistry.getInterval(client.id);
    clearIntervalAsync(interval);
    this.schedulerRegistry.deleteInterval(client.id);
  }
}
