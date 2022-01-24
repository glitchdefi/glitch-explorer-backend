import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Transaction } from '../../databases';
// import {
//   BlockTransactionsRO,
//   TransactionListRO,
//   TransactionRO,
// } from './transaction.interface';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private transactionRepository: Repository<Transaction>,
  ) {}

  async getTransactionsByHeight(
    height: number,
    pageSize: number,
    pageIndex: number,
  ): Promise<any> {
    try {
      const transactionCount = Number(
        (
          await this.transactionRepository
            .createQueryBuilder('transaction')
            .leftJoin('transaction.extrinsicIndex', 'extrinsic')
            .leftJoin('extrinsic.block', 'block')
            .where('block.index = :height', { height })
            .select('COUNT(*) AS count')
            .getRawOne()
        ).count,
      );
      const transactions = await this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoin('transaction.extrinsicIndex', 'extrinsic')
        .leftJoin('extrinsic.block', 'block')
        .where('block.index = :height', { height })
        .orderBy('transaction.id')
        .skip((pageIndex - 1) * pageSize)
        .take(pageSize)
        .getMany();

      return {
        data: transactions.map((transaction) => {
          return {
            ...transaction,
          };
        }),
        total: transactionCount,
        pagination: Math.ceil(transactionCount / pageSize),
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTransactionCount(): Promise<number> {
    try {
      return await this.transactionRepository.count();
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTransactionList(pageSize: number, pageIndex: number): Promise<any> {
    try {
      const transactionCount = await this.getTransactionCount();
      const transactions = await this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.extrinsicIndex', 'extrinsic')
        .leftJoinAndSelect('extrinsic.block', 'block')
        .orderBy('block.index', 'DESC')
        .addOrderBy('transaction.id', 'DESC')
        .skip((pageIndex - 1) * pageSize)
        .take(pageSize)
        .getMany();

      return {
        data: transactions.map((transaction) => {
          const block = transaction.extrinsicIndex.block.index;
          delete transaction.extrinsicIndex;

          return {
            ...transaction,
            block,
          };
        }),
        total: transactionCount,
        pagination: Math.ceil(transactionCount / pageSize),
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTransaction(hash: string): Promise<any> {
    try {
      const transaction = await this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.extrinsicIndex', 'extrinsic')
        .leftJoinAndSelect('extrinsic.block', 'block')
        .where('transaction.hash = :hash', {
          hash,
        })
        .getOne();

      if (!transaction) return null;

      const block = transaction.extrinsicIndex.block.index;
      delete transaction.extrinsicIndex;

      return {
        ...transaction,
        block,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getLatestTransaction(): Promise<any> {
    try {
      const transaction = await this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoin('transaction.extrinsicIndex', 'extrinsic')
        .leftJoinAndSelect('extrinsic.block', 'block')
        .orderBy('block.index', 'DESC')
        .addOrderBy('transaction.id', 'DESC')
        .getOne();

      if (!transaction) return null;

      return {
        ...transaction,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
