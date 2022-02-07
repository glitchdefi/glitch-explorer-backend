import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Block, Transaction, Address } from '../../databases';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @Inject('BLOCK_REPOSITORY')
    private blockRepository: Repository<Block>,
    @Inject('TRANSACTION_REPOSITORY')
    private transactionRepository: Repository<Transaction>,
    @Inject('ADDRESS_REPOSITORY')
    private addressRepository: Repository<Address>,
  ) {}

  async search(term: string): Promise<any> {
    try {
      const wallets = await this.addressRepository.find({
        address: term,
      });
      if (wallets.length) {
        return {
          wallet: wallets.map((wallet) => {
            return {
              ...wallet,
            };
          }),
        };
      }

      const transactions = await this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.extrinsicIndex', 'extrinsic')
        .leftJoinAndSelect('extrinsic.block', 'block')
        .where('transaction.hash = :term', { term })
        .getMany();

      if (transactions.length) {
        return {
          tx: transactions.map((transaction) => {
            return {
              ...transaction,
            };
          }),
        };
      }

      const height = Number(term);
      if (!isNaN(height)) {
        console.log(height);
        const blocks = await this.blockRepository.find({
          index: height,
        });
        if (blocks.length) {
          return {
            block: blocks.map((block) => {
              return {
                ...block,
              };
            }),
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
