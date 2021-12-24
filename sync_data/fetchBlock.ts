import { ApiPromise, WsProvider } from '@polkadot/api';
import { HeaderExtended } from '@polkadot/api-derive/types';
import { Balance, DispatchInfo, EventRecord } from '@polkadot/types/interfaces';
import { keyring } from '@polkadot/ui-keyring';
import { BN, formatNumber, isFunction } from '@polkadot/util';
import { getConnection, getManager } from 'typeorm';
import { Log, Block, Event, Extrinsic, Transaction } from '../src/databases';
import fetchOneBlock from './fetchOneBlock';
require('dotenv').config()
const RPC = process.env.RPC || 'wss://rpc.polkadot.io'
console.log('RPC', RPC)
const wsProvider = new WsProvider(RPC);
const MAX_HEADERS = 75;
const DEFAULT_TIME = new BN(6000);
function isKeyringLoaded() {
  try {
    return !!keyring.keyring;
  } catch {
    return false;
  }
}
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
  BridgeNetworks: {
    _enum: ["BSC", "Ethereum"],
  },
};
export interface HeaderExtendedWithMapping extends HeaderExtended {
  authorFromMapping?: string;
}

class FetchBlock {
  api: any;
  entityManager: any;
  connection: any;
  lastLog = 0;
  lastBlock=0;
  async init() {
    this.api = await ApiPromise.create({ provider: wsProvider, types: cloverTypes });
    const entityManager = getManager('postgres');
    this.entityManager = entityManager;
    this.connection = getConnection('postgres');
  }

  async wait(time = 1000): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  async fetchBlocks(): Promise<void> {
    const block = await this.entityManager.findOne(Block, {
      order: {
          index: "DESC",
      },
    });
    let from = process.env.FETCH_FROM_ZERO === 'true' ? (parseInt(process.env.FROM_BLOCK_HEIGHT) || 0) : (block ? block.index : 0)
    
    let funcs = []

    let step = process.env.MULTI_FETCH ? parseInt(process.env.MULTI_FETCH) : 1
   // fetch N block and continue
    if(step > 0)
      for (let i = 0; i < step; i++){
        funcs.push(this._fetchBlockInterval(from+i, step))
      }
    console.log("Run fetchs", funcs.length)
    await Promise.all(funcs)
  }

  async _fetchBlockInterval(from = 0, step=1): Promise<void> {
    try {
      let success = await this.fetchBlock(from);
      if (success) {
        let now = Math.floor(Date.now() / 1000)
      
        if (from % 1000 === 0 || now - this.lastLog > 60 || process.env.LOGALL) {
          
          console.log(`${new Date().toISOString()} fetchBlock success: from ${from}`);
          this.lastLog = now
        }
      } else {
        console.log(`${new Date().toISOString()} fetchBlock failed: from ${from}`);
      }
    } catch (error) {
      console.log(`${new Date().toISOString()} FetchBlocks Error: ${error.message}`);
    } finally {
      if (this.lastBlock > 0 && from < this.lastBlock) {
        from = from + step;
        await this._fetchBlockInterval(from, step);
      }
    }
  }
  async fetchBlock(height: number): Promise<boolean> {
    return fetchOneBlock.fetchBlock(height)
  }
}

const obj = new FetchBlock();
export default obj;
// no blockHash is specified, so we retrieve the latest
