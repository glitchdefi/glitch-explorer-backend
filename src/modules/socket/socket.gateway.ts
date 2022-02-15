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
import { ApiPromise, WsProvider } from '@polkadot/api';

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private socketService: SocketService,
  ) {}

  handleConnection(client: Socket) {
    let previousBlock;
    let previousTx;
    let previousFinalizedBlockNumber = 0;

    const callback = async () => {
      const httpProvider = new WsProvider(process.env.RPC);
      const api = await ApiPromise.create({ provider: httpProvider });
      const blockCount = await this.socketService.getBlockCount();
      const txCount = await this.socketService.getTxCount();
      const finalizedBlockNumber =
        await this.socketService.getFinalizedBlockNumber(api);

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

      if (finalizedBlockNumber > previousFinalizedBlockNumber) {
        client.emit('finalizedBlock', finalizedBlockNumber);
        previousFinalizedBlockNumber = finalizedBlockNumber;
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
