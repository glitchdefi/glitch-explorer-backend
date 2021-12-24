import fetchOneBlock from './fetchOneBlock'
require('dotenv').config()
const run = async (): Promise<void> => {
  let height = parseInt(process.argv ? process.argv[process.argv.length -1] : "-1")
  if (height >= 0) {
    await fetchOneBlock.fetchBlock(height)
  }
  process.exit()
}

run()