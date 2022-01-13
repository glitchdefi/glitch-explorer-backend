import { HeaderExtended } from '@polkadot/api-derive/types';
import { Balance, DispatchInfo, EventRecord } from '@polkadot/types/interfaces';
import { keyring } from '@polkadot/ui-keyring';
import { BN, formatNumber, isFunction } from '@polkadot/util';
import { Log, Block, Event, Extrinsic, Transaction, BalanceHistory, Address } from '../src/databases';
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
  lastBlock = 0;
  async init() {
    await Connection.init()
    await fetchBalance.init()
    this.api = Connection.api
    this.entityManager = Connection.entityManager
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
    const isFetchLog = process.env.SKIP_LOG !== "true"
    const isFetchEvent = process.env.SKIP_EVENT !== "true"
    const api = this.api;
    const byAuthor = this.byAuthor;
    const isAuthorIds = this.isAuthorIds;
    const isAuthorMappingWithDeposit = this.isAuthorMappingWithDeposit;

    const blockHash = await api.rpc.chain.getBlockHash(height)
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
      let block = await this.entityManager.findOne(Block, { where: { index: blockNumber.toNumber() } })
      if (!block) {
        block = new Block()
      }
      block.index = blockNumber.toNumber();
      block.hash = lastHeader.hash.toHex();
      block.parentHash = lastHeader.parentHash.toHex();
      block.validator = thisBlockAuthor;
      block.epoch = epoch;
      block.weight = weight.toString();
      block.time = time;
      block.reward = '0';
      block.extrinsicHash = lastHeader.extrinsicsRoot.toHex();
      block.eraIndex = era
      block.txNum = -1
      await this.connection.manager.save(block);


      const allRecords = await api.query.system.events.at(
        signedBlock.block.header.hash,
      );
      // map between the extrinsics and events
      let transactionDatas = [];
      let eventDatas = [];
      let extrinsic = await this.entityManager.findOne(Extrinsic, { where: { hash: lastHeader.extrinsicsRoot.toHex() } })
      if (!extrinsic) {
        extrinsic = new Extrinsic();
        extrinsic.hash = lastHeader.extrinsicsRoot.toHex();
        extrinsic.block = block
        try {
          await this.connection.manager.save(extrinsic);
        } catch (error) {
          // console.log(`save entrinsic failed`, error)
          await this.connection.createQueryBuilder().update(Extrinsic).set({ block: block }).where("hash = :hash", { hash: lastHeader.extrinsicsRoot.toHex() }).execute()
          extrinsic = await this.entityManager.findOne(Extrinsic, { where: { hash: lastHeader.extrinsicsRoot.toHex() } })
        }
      } else {
        await this.connection.createQueryBuilder().update(Extrinsic).set({ block: block }).where("hash = :hash", { hash: lastHeader.extrinsicsRoot.toHex() }).execute()
      }

      let accounts = {}
      //extract transaction
      const _buildTransactionData = async (section, method, ex, eventEntity, signer, args, dispatchInfo, success) => {
        if (section === 'balances') {
          if (method === 'transfer' || method === 'transferKeepAlive') {
            let fee = new BN(0);
            if (isFetchEvent) {
              eventEntity.from = signer?.toString();
              eventEntity.to = args && args.length ? args[0]?.toString() : '';
              eventEntity.value =
                args && args.length > 1 ? args[1].toString() : '';
            }


            let transactionData = {
              hash: ex.hash.toHex(),
              from: signer?.toString(),
              to: args[0].toString(),
              value: args[1].toString(),
              weight: dispatchInfo.weight.toString(),
              fee: fee.toString(),
              type: method,
              time: time,
              tip: ex.tip.toString(),
              extrinsicIndex: extrinsic.id,
              blockIndex: blockNumber.toNumber(),
              status: success ? "success" : "failed",
              fetchStatus: 0,
              exHash: ex.toHex().toString().substring(2),
            };
            transactionDatas.push(transactionData)
            accounts[transactionData.from] = transactionData.from
            accounts[transactionData.to] = transactionData.to
          }
        }
      }
      const _extractTransaction = async (ex, index): Promise<void> => {
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
        if (isFetchEvent) {
          eventEntity.name = `${section}.${method}`;
          eventEntity.hash = ex.hash.toHex();
          eventEntity.source = ex.toHex();
          eventEntity.log = '';
          eventEntity.weight = '';
          eventEntity.extrinsicIndex = extrinsic;
          eventEntity.blockIndex = blockNumber.toNumber()
        }

        let filtered = allRecords.filter(
          ({ phase }) =>
            phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index),
        );
        for (let [i, record] of filtered.entries()) {
          let { event } = record;
          if (api.events.system.ExtrinsicSuccess.is(event)) {
            const [dispatchInfo] = event.data;
            if (isFetchEvent) {
              eventEntity.weight = dispatchInfo.weight.toString();
            }
            // extract transfer
            await _buildTransactionData(section, method, ex, eventEntity, signer, args, dispatchInfo, true)
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
              if (isFetchEvent)
                eventEntity.log = dispatchError.toString();
            }
            await _buildTransactionData(section, method, ex, eventEntity, signer, args, dispatchInfo, false)
          }
        }
        if (isFetchEvent) {
          eventDatas.push(eventEntity)
        }
      };
      // console.log('--header', Date.now() - startTime)
      // startTime = Date.now()
      let startExtract = startTime
      for (let [ei, ex] of signedBlock.block.extrinsics.entries()) {
        await _extractTransaction(ex, ei);
      }
      // console.log('--extract', Date.now() - startExtract)
      // startTime = Date.now()
      let balanceHistoryDatas = []
      let addressDatas = []
      let accountAddresses = Object.keys(accounts)
      for (let [ai, accAdd] of accountAddresses.entries()) {
        addressDatas.push({ address: accAdd, role: 1 })
        let stored = await this.entityManager.findOne(BalanceHistory, { where: { address: accAdd, blockIndex: blockNumber.toNumber() } })
        if (stored) {
          continue
        }
        let balance = "-1"
        balanceHistoryDatas.push({ address: accAdd, balance: balance.toString(), blockIndex: blockNumber.toNumber(), time: time, fetchStatus: 0, headerHash: lastHeader.hash.toString().substring(2) })
      }
      await this.connection.createQueryBuilder().insert().into(BalanceHistory).values(balanceHistoryDatas).execute()
      await this.connection.createQueryBuilder().insert().into(Address).values(addressDatas).onConflict(`("address") DO NOTHING`).execute()

      // console.log('--balance', Date.now() - startExtract)
      // startTime = Date.now()

      if (isFetchEvent) await this.connection.createQueryBuilder().insert().into(Event).values(eventDatas).execute()

      await this.connection.createQueryBuilder().insert().into(Transaction).values(transactionDatas).execute()
      await this.connection.createQueryBuilder().update(Block).set({ txNum: transactionDatas.length }).where("index = :index", { index: blockNumber.toNumber() }).execute()

      // insert log
      let logs = [];
      if (isFetchLog) {
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
      }

      // console.log('--saveDB', Date.now() - startTime)
      // startTime = Date.now()
      console.log(`${new Date().toISOString()} fetchBlock success: height ${height} txNum ${transactionDatas.length} events ${eventDatas.length} balanceHistoryDatas ${balanceHistoryDatas.length} addressDatas ${addressDatas.length} logs ${logs.length}`);
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
