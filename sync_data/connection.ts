import { ApiPromise, WsProvider } from '@polkadot/api';
import { HeaderExtended } from '@polkadot/api-derive/types';
import { createConnections, getConnection, getManager } from 'typeorm';
import { Address, BalanceHistory, Block, Event, Extrinsic, Log, Transaction } from '../src/databases';
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
    schema: process.env.DATABASE_SCHEMA || `public`,
    logging: ["query", "error"],
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
const RPC = process.env.RPC || 'wss://rpc.polkadot.io'
console.log('RPC', RPC)
const wsProvider = new WsProvider(RPC);
const cloverTypes = {
  AccountInfo: {
    nonce: "Index",
    consumers: "RefCount",
    providers: "RefCount",
    data: "AccountData",
  },
  Amount: "i128",
  Keys: "SessionKeys4",
  AmountOf: "Amount",
  Balance: "u128",
  Rate: "FixedU128",
  Ratio: "FixedU128",
  EcdsaSignature: "[u8; 65]",
  EvmAddress: "H160",
  EthereumTxHash: "H256",
  Log: "H256",
  BridgeNetworks: {
    _enum: ["BSC", "Ethereum"],
  },
};
export interface HeaderExtendedWithMapping extends HeaderExtended {
  authorFromMapping?: string;
}

class Connection {
  api: any = null;
  entityManager: any = null;
  connection: any = null;
  async init() {
    if (!this.connection) { 
      await connect()
    }
    this.api = this.api ? this.api : await ApiPromise.create({ provider: wsProvider, types: cloverTypes });
    this.entityManager = this.entityManager ? this.entityManager : getManager('postgres');
    this.connection = this.connection? this.connection : getConnection('postgres');
  }
}

const obj = new Connection();
export default obj;
// no blockHash is specified, so we retrieve the latest
