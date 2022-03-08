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
      const wallets = await this.addressRepository
        .createQueryBuilder('address')
        .where(
          'LOWER(address.glitch_address) = LOWER(:term) OR LOWER(address.evm_address) = LOWER(:term)',
          { term },
        )
        .getMany();

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
        .where('LOWER(transaction.hash) = LOWER(:term)', { term })
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

      const height = Number.parseInt(term);
      let blocks = [];

      if (term.startsWith('0x') || isNaN(height)) {
        blocks = await this.blockRepository.find({
          hash: term,
        });
      } else {
        blocks = await this.blockRepository.find({
          index: height,
        });
      }

      if (blocks.length) {
        return {
          block: blocks.map((block) => {
            return {
              ...block,
            };
          }),
        };
      }

      return null;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
