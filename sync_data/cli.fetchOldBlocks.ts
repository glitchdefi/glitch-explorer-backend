import { Block } from '../src/databases/Block.entity';
import { Between, getManager } from 'typeorm';
import * as path from 'path';
import Connection from './connection'

import { fork } from 'child_process';
const wait = (time = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}
const fetchOldBLock = async () => {
  let ChildProcessPath = path.resolve(__dirname, "cli.fetchSomeBlocks.ts")
  let entityManager = getManager('postgres');;
  const lastBlock = await entityManager.findOne(Block, {
    order: {
        index: "DESC",
    },
  });
  let lastBlockHeight = (lastBlock ? lastBlock.index : 0)
  if (lastBlockHeight === 0) {
    console.log("---No Last Block found. Retry in 10s")
    await wait(10000)
    await fetchOldBLock()
    return
  }
  let spawnProcess = 0
  var proc
  const os = require('os')
  const cpuCount = process.env.MULTI_FETCH ? parseInt(process.env.MULTI_FETCH) : os.cpus().length - 1 
  const step = 100
  let start = process.env.START_FROM ? parseInt(process.env.START_FROM) : 0
  console.log(`${os.cpus().length} Core | Start ${cpuCount} processes, fetching from ${start}, last blockHeight`, lastBlockHeight)
  for (var i = start; i < lastBlockHeight; i+=step){
    let from = i
    let to = Math.min(i + step, lastBlockHeight)
    let [blocks, count] = await entityManager.findAndCount(Block, { index: Between(from, to) });
    let processTitle = `Process No.${spawnProcess + 1}/${cpuCount}`
    if (count > step) {
      console.log(`${new Date().toISOString()} fetched ${count} from ${i} to  ${to}\n-----------------------------------------------------\n`)
      continue
    } else {
      console.log(`${new Date().toISOString()}  Fork ${processTitle} is fetching from ${i} to  ${to}, in db ${count}`)
    }
    proc = fork(ChildProcessPath, ["ts-node", i.toString(), (to).toString(), processTitle ], { execArgv: [path.resolve(__dirname, "../node_modules/ts-node/dist/bin.js")] })
    spawnProcess++
    proc.on('close', (code) => {
      console.log(`${new Date().toISOString()} fetched from ${i} to  ${to}\n-----------------------------------------------------\n`)
      spawnProcess--
    });
    while (spawnProcess >= cpuCount) {
      await wait(1000)
    }
  }

  console.log(`---Feched to last block ${lastBlockHeight}. Rerun in 100s`)
  await wait(100000)
  await fetchOldBLock()
}
const run = async (): Promise<void> => {
  await Connection.init(false, true, false)
  fetchOldBLock()
}

run()