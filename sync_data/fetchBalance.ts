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
    await Connection.init(false, true, true)
    this.api = Connection.httpApi
  }

  async fetchBalance(address: string, parentHash: any): Promise<string> {
    const api = this.api || Connection.httpApi
    const balance = await api.query.system.account.at(parentHash, address);
    let {data} = balance
    // console.log(`fetchBalance ${address} parentHash ${parentHash} free ${data.free} reverse ${data.reverse} miscFrozen ${data.miscFrozen} feeFrozen ${data.feeFrozen}`)
    return data.free.add(data.reserved)
  }

  async fetchEthBalance(address: string, blockNumber: any): Promise<string> {
    const api = this.api || Connection.httpApi
    const balance = await api.rpc.eth.getBalance(address, blockNumber)
    console.log(address,blockNumber, balance.toString())
    return balance.toString()
  }
}

const obj = new FetchBalance();
export default obj;
// no blockHash is specified, so we retrieve the latest
