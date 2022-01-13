import { getManager } from 'typeorm';
import { Transaction } from '../src/databases';
import Connection from './connection'

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
const fetchTransactionFee = async () => {
  // get transaction not fetched fee
  let entityManager = getManager('postgres');
  const lastTransactions = await entityManager.find(Transaction, {
    where: {
      fetchStatus: 0
    },
    order: {
      id: "DESC",
    },
    take : 100
  });
  console.log(lastTransactions.length)
  if (lastTransactions.length === 0) {
    console.log('--- no transaction to fetch fee, wait 100s')
    await (100000)
    await fetchTransactionFee()
    return;
  }
  const fetchFee = async (transaction) => {
    if (Connection.api.rpc.payment.queryFeeDetails) {
      const ex = '0x' + transaction.exHash
      const blockHash = await getBlockHash(transaction.height)
      const queryFeeDetails = await Connection.api.rpc.payment.queryInfo(
        ex,
        blockHash,
      );
      if (queryFeeDetails) {
        transaction.fee = queryFeeDetails.partialFee;
        transaction.fetchStatus = 1
        await Connection.connection.createQueryBuilder().update(Transaction).set({ fee: queryFeeDetails.partialFee.toString(), fetchStatus: 1 }).where("id = :id", { id: transaction.id }).execute()
      }
    }
  }
  let funcs = lastTransactions.map(transaction => fetchFee(transaction))
  await Promise.all(funcs)
  await fetchTransactionFee()
}
const run = async (): Promise<void> => {
  await Connection.init()
  fetchTransactionFee()
}

run()