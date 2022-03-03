import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Block, Transaction } from '../../databases';

@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);

  constructor(
    @Inject('BLOCK_REPOSITORY')
    private blockRepository: Repository<Block>,
    @Inject('TRANSACTION_REPOSITORY')
    private transactionRepository: Repository<Transaction>,
  ) {}

  async getBlockLastest(): Promise<any> {
    try {
      const latestBlock = await this.blockRepository.findOne({
        order: {
          index: 'DESC',
        },
      });

      return {
        ...latestBlock,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTxLastest(): Promise<any> {
    try {
      const transaction = await this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoin('transaction.extrinsicIndex', 'extrinsic')
        .leftJoin('extrinsic.block', 'block')
        .orderBy('block.index', 'DESC')
        .addOrderBy('transaction.id');

      if (!transaction) return null;

      return {
        ...transaction,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getBlockCount(): Promise<number> {
    try {
      return await this.blockRepository.count();
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTxCount(): Promise<number> {
    try {
      return await this.transactionRepository.count();
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getFinalizedBlockNumber(api: any): Promise<number> {
    try {
      const blockHash = (await api.rpc.chain.getFinalizedHead()).toString();
      const block = await api.rpc.chain.getBlock(blockHash);

      return Number(block.block.header.number.toString().replace(',', ''));
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
