import { getManager } from 'typeorm';
import { BalanceHistory, Transaction } from '../src/databases';
import Connection from './connection'
import fetchBalance from './fetchBalance';

const blockHashes = {}
const wait = (time = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

const getBlockHash = async (height) => {
  let api = Connection.api
  if (blockHashes[height]) {
    return blockHashes[height]
  }
  const blockHash = await api.rpc.chain.getBlockHash(height)
  blockHashes[height] = blockHash
  return blockHash
}
const fetchBalanceHistory = async () => {
  // get transaction not fetched fee
  let entityManager = getManager('postgres');
  const rows = await entityManager.find(BalanceHistory, {
    where: {
      fetchStatus: 0
    },
    order: {
      id: "DESC",
    },
    take: 100
  });
  console.log(rows.length)
  if (rows.length === 0) {
    console.log('--- no balanceHistory to fetch, wait 100s')
    await (100000)
    await fetchBalanceHistory()
    return;
  }
  const fetch = async (balanceHistory) => {
    const headerHash = '0x' + balanceHistory.headerHash
    let balance = await fetchBalance.fetchBalance(balanceHistory.address, headerHash)
    await Connection.connection.createQueryBuilder().update(BalanceHistory).set({ balance: balance.toString(), fetchStatus: 1 }).where("id = :id", { id: balanceHistory.id }).execute()
  }
  let funcs = rows.map(transaction => fetch(transaction))
  await Promise.all(funcs)
  await fetchBalanceHistory()
}
const run = async (): Promise<void> => {
  await Connection.init()
  fetchBalanceHistory()
}

run()