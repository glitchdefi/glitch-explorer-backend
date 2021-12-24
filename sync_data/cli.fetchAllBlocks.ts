import { Block } from '../src/databases/Block.entity';
import { getManager } from 'typeorm';
import * as path from 'path';
import Connection from './connection'

import { fork } from 'child_process';
const fetchLastBlock = () => {
  let ChildProcessPath = path.resolve(__dirname , "cli.fetchLastBlocks.ts")
  const proc = fork(ChildProcessPath, ["ts-node"], { execArgv: [ path.resolve(__dirname , "../node_modules/ts-node/dist/bin.js")] })
}
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
    return
  }
  let spawnProcess = 0
  var proc
  const os = require('os')
  const cpuCount = os.cpus().length - 1
  const step = 10000
  for (var i = 0; i < lastBlockHeight; i+=step){
    proc = fork(ChildProcessPath, ["ts-node", i.toString(), (i+step).toString(),  `Process No.${spawnProcess}/${cpuCount}`], { execArgv: [path.resolve(__dirname, "../node_modules/ts-node/dist/bin.js")] })
    spawnProcess++
    proc.on('close', (code) => {
      console.log(`${new Date().toISOString()} fetched from ${i} to  ${i+step}\n-----------------------------------------------------\n`)
      spawnProcess--
    });
    while (spawnProcess >= cpuCount) {
      await wait(1000)
    }
  }
}
const run = async (): Promise<void> => {
  await Connection.init()
  fetchLastBlock()
  fetchOldBLock()
}

run()