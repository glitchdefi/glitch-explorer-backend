import { Block } from '../src/databases/Block.entity';
import { Between, getManager } from 'typeorm';
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
  const cpuCount = process.env.MULTI_FETCH ? parseInt(process.env.MULTI_FETCH) : os.cpus().length - 1 
  const step = 100
  let start = process.env.START_FROM ? parseInt(process.env.START_FROM) : 0
  console.log(`Start ${cpuCount} processes, fetching from ${start}, last blockHeight`, lastBlockHeight)
  for (var i = start; i < lastBlockHeight; i+=step){
    let from = i
    let to = i + step
    let [blocks, count] = await entityManager.findAndCount(Block, { index: Between(from, to) });
    if (count >= step) {
      console.log(`${new Date().toISOString()} fetched from ${i} to  ${i+step}\n-----------------------------------------------------\n`)
      continue
    } else {
      console.log(`${new Date().toISOString()}  Fork Process No.${spawnProcess}/${cpuCount} is fetching from ${i} to  ${i+step}, in db ${count}`)
    }
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