import { ApiPromise, WsProvider } from '@polkadot/api';
import { HeaderExtended } from '@polkadot/api-derive/types';
import { Balance, DispatchInfo, EventRecord } from '@polkadot/types/interfaces';
import { keyring } from '@polkadot/ui-keyring';
import { BN, formatNumber, isFunction } from '@polkadot/util';
import { getConnection, getManager } from 'typeorm';
import { Log, Block, Event, Extrinsic, Transaction } from '../src/databases';

const wsProvider = new WsProvider(process.env.RPC || 'wss://rpc.polkadot.io');
const MAX_HEADERS = 75;
const DEFAULT_TIME = new BN(6000);
function isKeyringLoaded() {
  try {
    return !!keyring.keyring;
  } catch {
    return false;
  }
}

export interface HeaderExtendedWithMapping extends HeaderExtended {
  authorFromMapping?: string;
}

class FetchBlock {
  api: any;
  entityManager: any;
  connection: any;
  byAuthor: Record<string, string> = {};
  eraPoints: Record<string, string> = {};
  lastHeaders: HeaderExtendedWithMapping[] = [];
  lastBlockAuthors: string[] = [];
  lastBlockNumber: string = '0';
  isAuthorIds: boolean = false;
  isAuthorMappingWithDeposit: boolean = false;
  async init() {
    this.api = await ApiPromise.create({ provider: wsProvider });
    const api = this.api;
    const entityManager = getManager('postgres');
    this.entityManager = entityManager;
    this.connection = getConnection('postgres');
    // const [
    //   systemChain,
    //   systemChainType,
    // ] = await Promise.all([
    //   api.rpc.system.chain(),
    //   api.rpc.system.chainType
    //     ? api.rpc.system.chainType()
    //     : Promise.resolve(registry.createType('ChainType', 'Live')),
    // ])
    // const isDevelopment =
    //   systemChainType.isDevelopment ||
    //   systemChainType.isLocal ||
    //   isTestChain(systemChain)

    // isKeyringLoaded() ||
    //   keyring.loadAll({
    //     genesisHash: this.api.genesisHash,
    //     isDevelopment,
    //   })

    this.isAuthorIds = isFunction(this.api.query.authorMapping?.authorIds); // TODO-MOONBEAM reevaluate in a month: 07/16/21
    this.isAuthorMappingWithDeposit = isFunction(
      this.api.query.authorMapping?.mappingWithDeposit,
    );
    // await this.fetch()
  }
  async getValidatorList() {
    const api = this.api;
    const setValidators = this.setValidators;
    api.isReady.then((): void => {
      // subscribe to all validators
      api.query.session &&
        api.query.session
          .validators((validatorIds: Array<any>): void => {
            setValidators(
              validatorIds.map((validatorId) => validatorId.toString()),
            );
          })
          .catch(console.error);
    });
  }
  async fetch() {
    this.api.derive.chain.subscribeNewHeads(
      async (header: HeaderExtendedWithMapping) => {
        await this.fetchOneBlock(header.number.toNumber());
      },
    );
  }
  setValidators(validatorIds: Array<string>) {
    console.log(validatorIds.length);
  }

  extractEventDetails(events?: EventRecord[]): [BN?, BN?, BN?] {
    return events
      ? events.reduce(
          (
            [deposits, transfers, weight],
            { event: { data, method, section } },
          ) => [
            section === 'balances' && method === 'Deposit'
              ? deposits.iadd(data[1] as Balance)
              : deposits,
            section === 'balances' && method === 'Transfer'
              ? transfers.iadd(data[2] as Balance)
              : transfers,
            section === 'system' &&
            ['ExtrinsicFailed', 'ExtrinsicSuccess'].includes(method)
              ? weight.iadd(
                  (
                    (method === 'ExtrinsicSuccess'
                      ? data[0]
                      : data[1]) as DispatchInfo
                  ).weight,
                )
              : weight,
          ],
          [new BN(0), new BN(0), new BN(0)],
        )
      : [];
  }

  async fetchOneBlock(height: number | null) {
    const api = this.api;
    const byAuthor = this.byAuthor;
    const isAuthorIds = this.isAuthorIds;
    const isAuthorMappingWithDeposit = this.isAuthorMappingWithDeposit;

    const blockHash = height
      ? await api.rpc.chain.getBlockHash(height)
      : await api.rpc.chain.getBlockHash();
    const signedBlock = await api.rpc.chain.getBlock(blockHash);

    const lastHeader: HeaderExtendedWithMapping | undefined =
      await api.derive.chain.getHeader(blockHash);
    if (lastHeader?.number) {
      const blockNumber = lastHeader.number.unwrap();
      let thisBlockAuthor = '';

      if (lastHeader.author) {
        thisBlockAuthor = lastHeader.author.toString();
      } else if (
        isAuthorMappingWithDeposit &&
        lastHeader.digest.logs &&
        lastHeader.digest.logs[0] &&
        lastHeader.digest.logs[0].isConsensus &&
        lastHeader.digest.logs[0].asConsensus[1]
      ) {
        // Some blockchains such as Moonbeam need to fetch the author accountId from a mapping
        thisBlockAuthor = (
          (
            await api.query.authorMapping.mappingWithDeposit(
              lastHeader.digest.logs[0].asConsensus[1],
            )
          ).toHuman() as {
            account: string;
            deposit: string;
          }
        ).account;
        lastHeader.authorFromMapping = thisBlockAuthor;
      } else if (
        isAuthorIds &&
        lastHeader.digest.logs &&
        lastHeader.digest.logs[0] &&
        lastHeader.digest.logs[0].isConsensus &&
        lastHeader.digest.logs[0].asConsensus[1]
      ) {
        // TODO-MOONBEAM reevaluate in a month: 07/16/21
        // Some blockchains such as Moonbeam need to fetch the author accountId from a mapping (function call may differ according to pallet version)
        thisBlockAuthor = (
          await api.query.authorMapping.authorIds(
            lastHeader.digest.logs[0].asConsensus[1],
          )
        ).toString();
        lastHeader.authorFromMapping = thisBlockAuthor;
      }

      const thisBlockNumber = formatNumber(blockNumber);

      if (thisBlockAuthor) {
        byAuthor[thisBlockAuthor] = thisBlockNumber;

        if (thisBlockNumber !== this.lastBlockNumber) {
          this.lastBlockNumber = thisBlockNumber;
          this.lastBlockAuthors = [thisBlockAuthor];
        } else {
          this.lastBlockAuthors.push(thisBlockAuthor);
        }
      }

      this.lastHeaders = this.lastHeaders
        .filter(
          (old, index) =>
            index < MAX_HEADERS && old.number.unwrap().lt(blockNumber),
        )
        .reduce(
          (next, header): HeaderExtendedWithMapping[] => {
            next.push(header);

            return next;
          },
          [lastHeader],
        )
        .sort((a, b) => b.number.unwrap().cmp(a.number.unwrap()));

      // get weight
      const [deposits, transfers, weight] = this.extractEventDetails(
        await api.query.system.events.at(blockHash),
      );

      // calculate block time
      let epoch = Math.floor(
        blockNumber.div(api.consts.babe.epochDuration).toNumber(),
      );
      let era = Math.floor(
        epoch / api.consts.staking.sessionsPerEra.toNumber(),
      );
      let time = Number(await api.query.timestamp.now.at(lastHeader.hash));

      const allRecords = await api.query.system.events.at(
        signedBlock.block.header.hash,
      );
      // map between the extrinsics and events
      let transactions = [];
      let txNum = 0;
      let events = [];
      const extrinsic = new Extrinsic();
      extrinsic.hash = lastHeader.extrinsicsRoot.toHex();
      await this.connection.manager.save(extrinsic);

      //extract transaction
      var _extractTransaction = async (ex, index): Promise<void> => {
        const {
          method: {
            method,
            section,
            args: { dest },
          },
          signer,
          hash,
          nonce,
          tip,
          ...any
        } = ex;
        const args = ex.method.args;
        let eventEntity = new Event();
        eventEntity.name = `${section}.${method}`;
        eventEntity.hash = ex.hash.toHex();
        eventEntity.source = ex.toHex();
        eventEntity.log = '';
        eventEntity.weight = '';
        eventEntity.extrinsicIndex = extrinsic;

        let filtered = allRecords.filter(
          ({ phase }) =>
            phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index),
        );
        for (let [i, record] of filtered.entries()) {
          let { event } = record;
          if (api.events.system.ExtrinsicSuccess.is(event)) {
            const [dispatchInfo] = event.data;
            eventEntity.weight = dispatchInfo.weight.toString();
            // extract transfer
            if (section === 'balances') {
              if (method === 'transfer' || method === 'transferKeepAlive') {
                let fee = new BN(0);
                if (api.rpc.payment.queryFeeDetails) {
                  const queryFeeDetails = await api.rpc.payment.queryInfo(
                    ex.toHex(),
                    blockHash,
                  );
                  if (queryFeeDetails) {
                    fee = queryFeeDetails.partialFee;
                  }
                }
                eventEntity.from = signer?.toString();
                eventEntity.to = args && args.length ? args[0]?.toString() : '';
                eventEntity.value =
                  args && args.length > 1 ? args[1].toString() : '';

                let transactionData = {
                  hash: ex.hash.toHex(),
                  from: signer?.toString(),
                  to: args[0].toString(),
                  value: args[1].toString(),
                  weight: dispatchInfo.weight.toString(),
                  fee: fee,
                  type: method,
                  time: new Date(time),
                  tip: ex.tip.toNumber(),
                  extrinsicIndex: extrinsic.id,
                  status: "success"
                };
                let transaction = await this.entityManager.insert(
                  Transaction,
                  transactionData,
                );
                txNum++;
              }
            }
          } else if (api.events.system.ExtrinsicFailed.is(event)) {
            const [dispatchError, dispatchInfo] = event.data;
            let errorInfo;

            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(
                dispatchError.asModule,
              );

              errorInfo = `${decoded.section}.${decoded.name}`;
              
            } else {
              errorInfo = dispatchError.toString();
              eventEntity.log = dispatchError.toString();
            }
            if (section === 'balances') {
              if (method === 'transfer' || method === 'transferKeepAlive') {
                let fee = new BN(0);
                if (api.rpc.payment.queryFeeDetails) {
                  const queryFeeDetails = await api.rpc.payment.queryInfo(
                    ex.toHex(),
                    blockHash,
                  );
                  if (queryFeeDetails) {
                    fee = queryFeeDetails.partialFee;
                  }
                }
                eventEntity.from = signer?.toString();
                eventEntity.to = args && args.length ? args[0]?.toString() : '';
                eventEntity.value =
                  args && args.length > 1 ? args[1].toString() : '';

                let transactionData = {
                  hash: ex.hash.toHex(),
                  from: signer?.toString(),
                  to: args[0].toString(),
                  value: args[1].toString(),
                  weight: dispatchInfo.weight.toString(),
                  fee: fee,
                  type: method,
                  time: new Date(time),
                  tip: ex.tip.toNumber(),
                  extrinsicIndex: extrinsic.id,
                  status: "failed"
                };
                let transaction = await this.entityManager.insert(
                  Transaction,
                  transactionData,
                );
                txNum++;
              }
            }
            console.log(
              `${section}.${method}:: ExtrinsicFailed:: ${errorInfo}`,
            );
          }
        }

        await this.connection.manager.save(eventEntity);
      };
      for (let [ei, ex] of signedBlock.block.extrinsics.entries()) {
        await _extractTransaction(ex, ei);
      }

      const block = new Block();
      block.index = blockNumber.toNumber();
      block.hash = lastHeader.hash.toHex();
      block.parentHash = lastHeader.parentHash.toHex();
      block.validator = thisBlockAuthor;
      block.epoch = epoch;
      block.weight = weight.toString();
      block.time = new Date(time);
      block.reward = '0';
      block.extrinsicHash = lastHeader.extrinsicsRoot.toHex();
      (block.eraIndex = era), (block.txNum = txNum);
      block.extrinsic = extrinsic;
      await this.connection.manager.save(block);
      // insert log
      let logs = [];
      for (let [li, log] of signedBlock.block.header.digest.logs.entries()) {
        log = log.toHuman();
        let logEntity = new Log();
        logEntity.title = Object.keys(log)[0];
        logEntity.ConsensusEngineId = Object.values(log)[0][0];
        logEntity.byte = Object.values(log)[0][1];
        logEntity.blockIndex = block;
        await this.connection.manager.save(logEntity);
      }
      // await this.connection.createQueryBuilder().update(Block).set({ txNum: }).where("index=:index", { index: block.index }).execute()
    }
  }

  _debug(...args: any[]): void {
    // console.log(args)
  }

  async wait(time = 1000): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  async fetchBlocks(): Promise<void> {
    const block = await this.entityManager.findOne(Block);
    console.log(JSON.stringify(block));
    let from = 2538 //block? block.index : 0
    // fetch N block and continue
    await this._fetchBlockInterval(from);
  }

  async _fetchBlockInterval(from = 0): Promise<void> {
    try {
      let success = await this.fetchBlock(from);
      if (success) {
        console.log(`fetchBlock success: from ${from}`);
        from++;
        await this._fetchBlockInterval(from);
      } else {
        console.log(`fetchBlock failed: from ${from}`);
      }
    } catch (error) {
      console.log(`FetchBlocks Error: ${error.message}`);
    } finally {
    }
  }
  async fetchBlock(height: number): Promise<boolean> {
    try {
      const block = await this.entityManager.findOne(Block, height);
      if (block) {
        return true;
      }
      await this.fetchOneBlock(height);
      return true;
    } catch (error) {
      console.log(`fetchBlock ${height} Error: ${error.message}`);
      await this.wait(1000);
      return this.fetchBlock(height);
    }
  }
}

const obj = new FetchBlock();
export default obj;
// no blockHash is specified, so we retrieve the latest
