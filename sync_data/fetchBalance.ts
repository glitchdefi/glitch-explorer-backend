import { HeaderExtended } from '@polkadot/api-derive/types';
import { keyring } from '@polkadot/ui-keyring';
import { Hash } from 'crypto';
import Connection from './connection';
import fetchOneBlock from './fetchOneBlock';
require('dotenv').config()
export interface HeaderExtendedWithMapping extends HeaderExtended {
  authorFromMapping?: string;
}

class FetchBalance {
  api: any;
  web3: any;
  entityManager: any;
  connection: any;
  async init() {
    await Connection.init()
    this.api = Connection.api
  }

  async fetchBalance(address: string, parentHash: any): Promise<string> {
    const api = this.api || Connection.api
    const balance = await api.query.system.account.at(parentHash, address);
    let {data} = balance

    return data.free.add(data.reserved).add(data.miscFrozen).add(data.feeFrozen)
  }
}

const obj = new FetchBalance();
export default obj;
// no blockHash is specified, so we retrieve the latest
