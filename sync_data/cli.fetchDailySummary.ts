require('dotenv').config()
import { getConnection, getManager } from 'typeorm';
import { DailySummary } from '../src/databases/DailySummary.entity';
import Connection from './connection'

const blockHashes = {}
const wait = (time = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}


const fetchSummary = async () => {
  // get transaction not fetched fee
  const schema = process.env.DATABASE_SCHEMA
  let entityManager = getManager('postgres');
  let connection = getConnection('postgres')
  let now = new Date()
  var dataObjs = {

  }
  const newAccs = await entityManager.query(
    `SELECT COUNT(*) as new_acc, date_trunc('day', created) as day FROM ${schema}.address GROUP BY day;`
  )
  newAccs.forEach(each => {
    if (dataObjs[each.day]) {
      dataObjs[each.day].newAcc = each.new_acc
    } else {
      dataObjs[each.day] = {
        time: each.day,
        newAcc: each.new_acc
      }
    }
  })
  const txNums = await entityManager.query(
    `SELECT
      SUM(tx_num) as tx_count,
      date_trunc('day', time) as day
      FROM ${schema}.block
      where index > 0
      GROUP BY day 
  `
  )
  txNums.forEach(each => {
    if (dataObjs[each.day]) {
      dataObjs[each.day].txCount = each.tx_count
    } else {
      dataObjs[each.day] = {
        time: each.day,
        txCount: each.tx_count
      }
    }
  })
  const blockTimes = await entityManager.query(`
  SELECT max(INDEX) AS max_index,
  MIN(INDEX) AS min_index, 
  extract(epoch from MAX(TIME)) -  extract(epoch from MIN(TIME))  AS totalBlockTime ,
  (max(INDEX) - MIN(INDEX) + 1) AS totalBlockNum,
  (extract(epoch from MAX(TIME)) -  extract(epoch from MIN(TIME)) )/ (max(INDEX) - MIN(INDEX)) AS ave,
  date_trunc('day', time) as day 
  FROM ${schema}.block
  WHERE INDEX > 0
  GROUP BY DAY
  `)
  blockTimes.forEach(each => {
    if (dataObjs[each.day]) {
    } else {
      dataObjs[each.day] = {
        time: each.day,
      }
    }
    dataObjs[each.day].aveBlockTime = each.ave
    dataObjs[each.day].blockStart = each.min_index
    dataObjs[each.day].blockEnd = each.max_index
  })
  // console.log(dataObjs)
  await connection.createQueryBuilder().insert().into(DailySummary).values(Object.values(dataObjs))
    .orUpdate({
      conflict_target: ["time"],
      overwrite: ["ave_block_time", "tx_count", "new_acc", "block_start", "block_end"],
    })
    .execute()
  
  await wait(60 * 60 * 1000)
  await fetchSummary()
  
}
const run = async (): Promise<void> => {
  await Connection.init(false, true)
  fetchSummary()
}

run()