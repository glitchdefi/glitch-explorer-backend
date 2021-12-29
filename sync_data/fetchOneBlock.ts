import { HeaderExtended } from '@polkadot/api-derive/types';
import { Balance, DispatchInfo, EventRecord } from '@polkadot/types/interfaces';
import { keyring } from '@polkadot/ui-keyring';
import { BN, formatNumber, isFunction } from '@polkadot/util';
import { Log, Block, Event, Extrinsic, Transaction, BalanceHistory } from '../src/databases';
import Connection from './connection'
import fetchBalance from './fetchBalance';
require('dotenv').config()
const fs = require('fs');
const MAX_HEADERS = 75;
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

class FetchOneBlock {
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
  lastLog = 0;
  lastBlock=0;
  async init() {
    await Connection.init()
    await fetchBalance.init()
    this.api = Connection.api
    this.entityManager =  Connection.entityManager
    this.connection = Connection.connection
    this.isAuthorIds = isFunction(this.api.query.authorMapping?.authorIds); // TODO-MOONBEAM reevaluate in a month: 07/16/21
    this.isAuthorMappingWithDeposit = isFunction(
      this.api.query.authorMapping?.mappingWithDeposit,
    );
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

  async _fetchOneBlock(height: number | null) {
    let startTime = Date.now()
    const api = this.api;
    const byAuthor = this.byAuthor;
    const isAuthorIds = this.isAuthorIds;
    const isAuthorMappingWithDeposit = this.isAuthorMappingWithDeposit;

    const blockHash =  await api.rpc.chain.getBlockHash(height)
      // ? await api.rpc.chain.getBlockHash(height)
      // : await api.rpc.chain.getBlockHash();
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
      let time = new Date(Number(await api.query.timestamp.now.at(lastHeader.hash)));

      const allRecords = await api.query.system.events.at(
        signedBlock.block.header.hash,
      );
      // map between the extrinsics and events
      let transactionDatas = [];
      let txNum = 0;
      let eventDatas = [];
      const extrinsic = new Extrinsic();
      extrinsic.hash = lastHeader.extrinsicsRoot.toHex();
      await this.connection.manager.save(extrinsic);
      let accounts = {}
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
                if (!process.env.SKIP_FEE &&  api.rpc.payment.queryFeeDetails) {
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
                  time: time,
                  tip: ex.tip.toString(),
                  extrinsicIndex: extrinsic.id,
                  status: "success"
                };
                transactionDatas.push(transactionData)
                accounts[transactionData.from] = transactionData.from
                accounts[transactionData.to] = transactionData.to
                txNum++;
              }
            }
          } else if (api.events.system.ExtrinsicFailed.is(event)) {
            const [dispatchError, dispatchInfo] = event.data;
            let errorInfo;

            if (dispatchError.isModule) {
              try {
                const decoded = api.registry.findMetaError(
                  dispatchError.asModule,
                );
  
                errorInfo = `${decoded.section}.${decoded.name}`;
              } catch (error) {
                // console.log(error)
              }
              
            } else {
              errorInfo = dispatchError.toString();
              eventEntity.log = dispatchError.toString();
            }
            if (section === 'balances') {
              if (method === 'transfer' || method === 'transferKeepAlive') {
                let fee = new BN(0);
                if (!process.env.SKIP_FEE && api.rpc.payment.queryFeeDetails) {
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
                  time: time,
                  tip: ex.tip.toString(),
                  extrinsicIndex: extrinsic.id,
                  status: "failed"
                };
                transactionDatas.push(transactionData)
                accounts[transactionData.from] = transactionData.from
                accounts[transactionData.to] = transactionData.to
                txNum++;
              }
            }
            // console.log(
            //   `${section}.${method}:: ExtrinsicFailed:: ${errorInfo}`,
            // );
          }
        }
        eventDatas.push(eventEntity)
        // await this.connection.manager.save(eventEntity);
      };
      // startTime = Date.now()
      // let startExtract = startTime
      for (let [ei, ex] of signedBlock.block.extrinsics.entries()) {
        await _extractTransaction(ex, ei);
      }
      // console.log('--extract', Date.now() - startExtract)
      // startTime = Date.now()
      await this.connection.createQueryBuilder().insert().into(Event).values(eventDatas).execute()
      await this.connection.createQueryBuilder().insert().into(Transaction).values(transactionDatas).execute()
      let accountAddresses = Object.keys(accounts)
      let balanceHistoryDatas = []
      for (let [ai, accAdd] of accountAddresses.entries()) {
        let stored = await this.entityManager.findOne(BalanceHistory, { where: { address: accAdd, blockIndex: blockNumber.toNumber() } })
        if (stored) {
          continue
        }
        let balance = await fetchBalance.fetchBalance(accAdd, lastHeader.hash)
        balanceHistoryDatas.push({ address: accAdd, balance: balance.toString(), blockIndex: blockNumber.toNumber(), time: time })
      }
      await this.connection.createQueryBuilder().insert().into(BalanceHistory).values(balanceHistoryDatas).execute()
    
      const block = new Block();
      block.index = blockNumber.toNumber();
      block.hash = lastHeader.hash.toHex();
      block.parentHash = lastHeader.parentHash.toHex();
      block.validator = thisBlockAuthor;
      block.epoch = epoch;
      block.weight = weight.toString();
      block.time = time;
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
        logs.push(logEntity)
      }
      await this.connection.createQueryBuilder().insert().into(Log).values(logs).execute()
      // console.log('--saveDB', Date.now() - startTime)
      // startTime = Date.now()
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

  async fetchBlock(height: number): Promise<boolean> {
    try {
      const _startTime = Date.now()
      await this.init()
      const block = await this.entityManager.findOne(Block, height);
      if (block) {
        if (process.env.LOGALL === 'true') console.log(`${new Date().toISOString()} fetchBlock fromDB success: height ${height}`);
        return true;
      }
      await this._fetchOneBlock(height);
      console.log(`${new Date().toISOString()} fetchBlock success: height ${height} in ${Date.now() - _startTime} ms`);
      return true;
    } catch (error) {
      fs.appendFileSync('fetch_failed.log', `${new Date()}\height:${height}\treason:${error.message}\n`)
      console.log(`fetchBlock ${height} Error: ${error}`);
      return false
    }
  }
}

const obj = new FetchOneBlock();
export default obj;
// no blockHash is specified, so we retrieve the latest
