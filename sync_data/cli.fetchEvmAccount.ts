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
const THRESHOLD = 100
const fetch = async (addressObj) => {
  let entityManager = getManager('postgres');
  let api = Connection.httpApi
  let now = new Date()
  try {
    let evmAddress = (await api.query.evmAccounts.evmAddresses(addressObj.address))?.toString()
    if (evmAddress) {
      console.log(`${addressObj.address} linked ${evmAddress}`)
      let evmAddressEntity = await entityManager.findOne(Address, { where: { evmAddress } })
      if (evmAddressEntity) {
          let newBalance = evmAddressEntity.balance + addressObj.balance
          await Connection.connection.createQueryBuilder().delete().from(Address).where("id = :id", { id: Math.max(evmAddressEntity.id, addressObj.id) }).execute()
          await Connection.connection.createQueryBuilder().update(Address).set({ evmAddress: evmAddress, lastFetchEvm: now, balance: newBalance}).where("id = :id", { id:  Math.min(evmAddressEntity.id, addressObj.id) }).execute()
      } else {
        await Connection.connection.createQueryBuilder().update(Address).set({ evmAddress: evmAddress, lastFetchEvm: now}).where("id = :id", { id: addressObj.id }).execute()
      }
      
    } else {
      await Connection.connection.createQueryBuilder().update(Address).set({ lastFetchEvm: now}).where("id = :id", { id: addressObj.id }).execute()
      return true
    }
  } catch (error) {
    console.log(error)
  }
}


const fetchEvm = async (addressObj) => {
  let entityManager = getManager('postgres');
  let api = Connection.httpApi
  let now = new Date()
  try {
    let address = (await api.query.evmAccounts.accounts(addressObj.evmAddress))?.toString()
    if (address) {
      console.log(`${addressObj.evmAddress} linked ${address}`)
      let addressEntity = await entityManager.findOne(Address, { where: { address: address } })
      if (addressEntity) {
        let newBalance = addressEntity.balance + addressObj.balance
          await Connection.connection.createQueryBuilder().delete().from(Address).where("id = :id", { id: Math.max(addressEntity.id, addressObj.id) }).execute()
          await Connection.connection.createQueryBuilder().update(Address).set({ address: address, lastFetchEvm: now, balance: newBalance}).where("id = :id", { id:  Math.min(addressEntity.id, addressObj.id) }).execute()
      } else {
        await Connection.connection.createQueryBuilder().update(Address).set({ address: address, lastFetchEvm: now}).where("id = :id", { id: addressObj.id }).execute()
      }
      
    } else {
      await Connection.connection.createQueryBuilder().update(Address).set({ lastFetchEvm: now}).where("id = :id", { id: addressObj.id }).execute()
      return true
    }
  } catch (error) {
    console.log(error)
  }
}

const fetchEvmAddress = async () => {
  // get transaction not fetched fee
  let entityManager = getManager('postgres');
  const rows = await entityManager.find(Address, { where: { evmAddress: IsNull() }, order: { lastFetchEvm: "ASC", }, take: THRESHOLD });
  console.log("Find:", rows.length, "addresses")
  let funcs = rows.map(each => fetch(each))
  await Promise.all(funcs)

  const evmRows = await entityManager.find(Address, { where: { address: IsNull() }, order: { lastFetchEvm: "ASC", }, take: THRESHOLD });
  console.log("Find:", evmRows.length, " evm addresses")
  funcs = evmRows.map(each => fetchEvm(each))
  await Promise.all(funcs)


  await wait(3000)
  await fetchEvmAddress()
}
const run = async (): Promise<void> => {
  await Connection.init(false, true, true)
  fetchEvmAddress()
}

run()