import { HeaderExtended } from '@polkadot/api-derive/types';
import { keyring } from '@polkadot/ui-keyring';
import Connection from './connection';
import fetchOneBlock from './fetchOneBlock';
import fetchStaking from './fetchStaking';
require('dotenv').config()
export interface HeaderExtendedWithMapping extends HeaderExtended {
  authorFromMapping?: string;
}

class FetchLastBlock {
  api: any;
  entityManager: any;
  connection: any;
  lastLog = 0;
  lastBlock=0;
  async init() {
    await Connection.init()
    this.api = Connection.api
    await this.fetch()
  }

  async fetch() {
    this.api.derive.chain.subscribeNewHeads(
      async (header: HeaderExtendedWithMapping) => {
        await this.fetchBlock(header.number.toNumber());
      },
    );
  }


  async wait(time = 1000): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  async fetchBlock(height: number): Promise<boolean> {
    await fetchStaking.fetchStaking(height)
    return fetchOneBlock.fetchBlock(height)
  }
}

const obj = new FetchLastBlock();
export default obj;
// no blockHash is specified, so we retrieve the latest
