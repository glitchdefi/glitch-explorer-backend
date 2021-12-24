import fetchOneBlock from './fetchOneBlock'
require('dotenv').config()
const run = async (): Promise<void> => {
  let from = parseInt(process.argv ? process.argv[process.argv.length - 3] : "-1")
  let to = parseInt(process.argv ? process.argv[process.argv.length - 2] : "-1")
  let processName = process.argv ? process.argv[process.argv.length - 1] : "-1"
  if (from >= 0) {
    for (var height = from; height <= to; height++){
      await fetchOneBlock.fetchBlock(height)
    }
  }
  console.log(`${new Date().toISOString()} ${processName} done`)
  process.exit()
}

run()