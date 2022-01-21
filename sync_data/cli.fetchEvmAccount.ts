import { getManager, IsNull } from 'typeorm';
import { Address } from '../src/databases';
import Connection from './connection';
const wait = (time = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

const fetchEvmAddress = async () => {
  // get transaction not fetched fee
  let entityManager = getManager('postgres');
  const rows = await entityManager.find(Address, {
    where: {
      evmAddress: IsNull()
    },
    order: {
      id: "DESC",
    },
    take: 100
  });
  console.log(rows.length)
  if (rows.length === 0) {
    console.log('--- no evmAddress to fetch, wait 100s')
    await wait(100000)
    await fetchEvmAddress()
    return;
  }
  let api = Connection.httpApi
  const fetch = async (addressObj) => {
    try {
      let evmAddress = (await api.query.evmAccounts.evmAddresses(addressObj.address))?.toString()
      if (evmAddress) {
        await Connection.connection.createQueryBuilder().update(Address).set({ evmAddress: evmAddress}).where("id = :id", { id: addressObj.id }).execute()
      } else {
        return true
      }
    } catch (error) {
      console.log(error)
    }
  }
  let funcs = rows.map(each => fetch(each))
  await Promise.all(funcs)
  await wait(1000)
  await fetchEvmAddress()
}
const run = async (): Promise<void> => {
  await Connection.init(false, true, true)
  fetchEvmAddress()
}

run()