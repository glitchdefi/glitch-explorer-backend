import fetchBlock from './fetchBlock'
import {createConnections, Connection} from "typeorm";
import { Block } from '../src/databases/Block.entity';
import { Log } from '../src/databases/Log.entity';
import { Transaction } from '../src/databases/Transaction.entity';
import { Address } from '../src/databases/Address.entity';
import { Event } from '../src/databases/Event.entity';
import { Extrinsic } from '../src/databases/Extrinsic.entity';
import { BalanceHistory } from '../src/databases/BalanceHistory.entity';
require('dotenv').config()
const connect = async (): Promise<void> => {
  await createConnections([{
    name: 'postgres',
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
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
  }]);
}
const run = async (): Promise<void> => {
  console.log('RPC:', process.env.RPC)
  await connect()
  await fetchBlock.init()
  await fetchBlock.fetchBlocks()
}

run()