import fetchOneBlock from './fetchOneBlock'
require('dotenv').config()
const run = async (): Promise<void> => {
  let from = parseInt(process.argv ? process.argv[process.argv.length - 3] : "-1")
  let to = parseInt(process.argv ? process.argv[process.argv.length - 2] : "-1")
  let processName = process.argv ? process.argv[process.argv.length - 1] : "-1"
  if (from >= 0) {
    const startTime = Date.now()
    for (var height = from; height <= to; height++){
      await fetchOneBlock.fetchBlock(height, true)
      // console.log(`${new Date().toISOString()} ${processName} fetched: height`, height)
    }

    // console.log(`+++++ ${new Date().toISOString()} ${processName} fetched from ${from} to ${to} in ${Date.now() - startTime} ms`)
  }
  // console.log(`${new Date().toISOString()} ${processName} From ${from} to ${to} done`)
  process.exit()
}

run()