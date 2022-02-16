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

const run = async (): Promise<void> => {
  await Connection.init(false, true, false)
  fetchLastBlock()
}

run()