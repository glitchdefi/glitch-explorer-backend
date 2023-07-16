import { encodeAddress } from '@polkadot/util-crypto';
import { NominatorValidator, Staking } from '../src/databases';
import Connection from './connection';
require('dotenv').config()

class FetchStaking {
  api: any;
  web3: any;
  entityManager: any;
  connection: any;
  epochDuration: any;
  sessionsPerEra: any;
  fetchedEras = {}
  async fetchStaking(blockNumber): Promise<void> {
    try {
      let api = Connection.api
      if (!this.epochDuration) {
        this.epochDuration = (api.consts.babe.epochDuration).toNumber()
        this.sessionsPerEra = api.consts.staking.sessionsPerEra.toNumber()
      }
      let epoch = Math.floor(
        blockNumber/ this.epochDuration,
      );
      let era = Math.floor(
        epoch / this.sessionsPerEra,
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
        let temp = JSON.parse(JSON.stringify(each[1]))
        resultNominators.push({
          address: ss58address,
          validators: temp.targets,
          submittedEra: temp.submittedIn
        })
      })
      let insertData = []
      //relationship
      let relationshipData = []
      validators.validators.forEach(validator => {
        insertData.push({
          address: validator.toString(),
          type: 0,
          era: era
        })
      })
      resultNominators.forEach(nominator => {
        // console.log(nominator)
        insertData.push({
          address: nominator.address.toString(),
          type: 1,
          era: era
        })
        nominator.validators.forEach(validator => {
          relationshipData.push({
            nominator: nominator.address.toString(),
            validator: validator.toString(),
            era: era,
            submittedEra: nominator.submittedEra
          })
        })
      })
      await Connection.connection.createQueryBuilder().insert().into(Staking).values(insertData).execute()
      await Connection.connection.createQueryBuilder().insert().into(NominatorValidator).values(relationshipData).execute()
      
    } catch (error) {
      console.log(error) 
    }
    
  }
}

const obj = new FetchStaking();
export default obj;
// no blockHash is specified, so we retrieve the latest
