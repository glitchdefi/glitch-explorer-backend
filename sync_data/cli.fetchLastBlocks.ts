import fetchLastBlock from './fetchLastBlock'
require('dotenv').config()

const run = async (): Promise<void> => {
  await fetchLastBlock.init()
}

run()