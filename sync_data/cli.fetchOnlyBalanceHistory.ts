import { Block } from './../src/databases/Block.entity';
import { BalanceHistory } from './../src/databases/BalanceHistory.entity';
import { getManager } from 'typeorm';
import { Extrinsic } from './../src/databases/Extrinsic.entity';
import { Transaction } from './../src/databases/Transaction.entity';
import Connection from './connection';
import fetchBalance from './fetchBalance';

const fetchBalanceOfBlock = async (blockIndex: number) => {

  console.log(`${new Date().toISOString()} balancehistory of block ${blockIndex} fetching...`)
  let entityManager = getManager('postgres');
  const block = await entityManager.findOne(Block, { where: { index: blockIndex } })
  if (!block || block.txNum === 0) {
    return
  }
  const extrinsicEntity = await entityManager.findOne(Extrinsic, { where: { block: block } })
  if (!extrinsicEntity) {
    return
  }
  const transactions = await entityManager.find(Transaction, { where: { extrinsicIndex: extrinsicEntity.id } })
  let accAddObjs = {}
  transactions.forEach(transaction => {
    accAddObjs[transaction.from] = transaction.from
    accAddObjs[transaction.to] = transaction.to
  })

  let accountAddresses = Object.keys(accAddObjs)
  for (let [ai, accAdd] of accountAddresses.entries()) {
    let stored = await entityManager.findOne(BalanceHistory, { where: { address: accAdd, blockIndex: blockIndex } })
    if (stored) {
      continue
    }
    let balance = await fetchBalance.fetchBalance(accAdd, block.hash)
    await entityManager.insert(BalanceHistory, { address: accAdd, balance: balance.toString(), blockIndex: blockIndex, time: block.time })
  }
  console.log(`${new Date().toISOString()} balancehistory of block ${blockIndex} fetched`)
}
const run = async (): Promise<void> => {
  await Connection.init()
  await fetchBalance.init()
  for (var i = 1; i < 100000; i++){
    
    await fetchBalanceOfBlock(i)
  }
}

run()