import * as path from 'path';

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
  fetchLastBlock()
}

run()