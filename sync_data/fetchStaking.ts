import { encodeAddress } from '@polkadot/util-crypto';
import { Staking } from '../src/databases';
import Connection from './connection';
require('dotenv').config()

class FetchStaking {
  api: any;
  web3: any;
  entityManager: any;
  connection: any;
  fetchedEras = {}
  async fetchStaking(blockNumber): Promise<void> {
    try {
      let api = Connection.api

      let epoch = Math.floor(
        blockNumber/(api.consts.babe.epochDuration).toNumber(),
      );
      let era = Math.floor(
        epoch / api.consts.staking.sessionsPerEra.toNumber(),
      );
      
      if (this.fetchedEras[era]) {
        return
      }
      let entityManager = Connection.entityManager;
      const eraEntity = await entityManager.findOne(Staking, {
        where: {
          era: era
        }
      });
      if (eraEntity) {
        this.fetchedEras[era] = true
        return
      }
      
      const validators = await api.derive.staking.validators()
      const nominators = await api.query.staking.nominators.entries()
      let resultNominators = []
      nominators.forEach(each => {
        let ss58address = encodeAddress('0x' + each[0].toString().substring(82)).toString()
        resultNominators.push(ss58address)
      })
      let result = {
        validators: validators.validators,
        nominators: resultNominators
      }
      let insertData = []
      validators.validators.forEach(validator => {
        insertData.push({
          address: validator.toString(),
          type: 0,
          era: era
        })
      })
      resultNominators.forEach(nominator => {
        insertData.push({
          address: nominator.toString(),
          type: 1,
          era: era
        })
      })
      await Connection.connection.createQueryBuilder().insert().into(Staking).values(insertData).execute()
    } catch (error) {
      console.log(error) 
    }
    
  }
}

const obj = new FetchStaking();
export default obj;
// no blockHash is specified, so we retrieve the latest
