import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Address, BalanceHistory, Transaction } from '../../databases';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    @Inject('ADDRESS_REPOSITORY')
    private addressRepository: Repository<Address>,
    @Inject('TRANSACTION_REPOSITORY')
    private transactionRepository: Repository<Transaction>,
    @Inject('BALANCE_HISTORY_REPOSITORY')
    private balanceHistoryRepository: Repository<BalanceHistory>,
  ) {}

  async getAddressList(pageSize: number, pageIndex: number): Promise<any> {
    try {
      const addressCount = await this.getAddressCount();
      const addresses = await this.addressRepository.query(
        `select a.*, count(t.id) as tx_count
        from address a
        left join transaction t
          on t.from = a.glitch_address or t.to = a.glitch_address
            or t.from = a.evm_address or t.to = a.evm_address
        group by a.id
        order by a.id desc
        limit ${pageSize}
        offset ${(pageIndex - 1) * pageSize}`,
      );

      return {
        data: addresses.map((address: any) => {
          return {
            ...address,
          };
        }),
        total: addressCount,
        pagination: Math.ceil(addressCount / pageSize),
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getAddressCount(): Promise<number> {
    try {
      return await this.addressRepository.count();
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getAddress(address: string): Promise<any> {
    try {
      const account = await this.addressRepository.findOne({
        where: [{ address: address }, { evmAddress: address }],
      });

      if (!account) return null;

      let txInfo = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('sum(value)', 'total_received')
        .where('transaction.to = :address', { address })
        .getRawOne();

      const totalReceived = txInfo.total_received || '0';

      txInfo = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('sum(value)', 'total_spend')
        .where('transaction.from = :address', { address })
        .getRawOne();

      const totalSpend = txInfo.total_spend || '0';

      txInfo = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('count(id)', 'total_tx')
        .where('transaction.from = :address OR transaction.to = :address', {
          address,
        })
        .getRawOne();

      const totalTx = txInfo.total_tx || '0';

      txInfo = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('time', 'last_tx_date')
        .where('transaction.from = :address OR transaction.to = :address', {
          address,
        })
        .orderBy('block_index', 'DESC')
        .getRawOne();

      const lastTxDate = txInfo.last_tx_date;

      return {
        ...account,
        totalReceived,
        totalSpend,
        totalTx,
        lastTxDate,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTransactionCount(address: string, getAll: boolean): Promise<number> {
    try {
      if (getAll) {
        return await this.transactionRepository.count({
          where: [{ from: address }, { to: address }],
        });
      } else {
        return await this.transactionRepository.count({ from: address });
      }
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTransactionList(
    address: string,
    pageSize: number,
    pageIndex: number,
    getAll: boolean,
  ): Promise<any> {
    try {
      const transactionCount = await this.getTransactionCount(address, getAll);
      let transactions = [];

      if (getAll) {
        transactions = await this.transactionRepository
          .createQueryBuilder('transaction')
          .leftJoinAndSelect('transaction.extrinsicIndex', 'extrinsic')
          .leftJoinAndSelect('extrinsic.block', 'block')
          .where('transaction.from = :address OR transaction.to = :address', {
            address,
          })
          .orderBy('block.index', 'DESC')
          .addOrderBy('transaction.id', 'DESC')
          .skip((pageIndex - 1) * pageSize)
          .take(pageSize)
          .getMany();
      } else {
        transactions = await this.transactionRepository
          .createQueryBuilder('transaction')
          .leftJoinAndSelect('transaction.extrinsicIndex', 'extrinsic')
          .leftJoinAndSelect('extrinsic.block', 'block')
          .where('transaction.from = :address', {
            address,
          })
          .orderBy('block.index', 'DESC')
          .addOrderBy('transaction.id', 'DESC')
          .skip((pageIndex - 1) * pageSize)
          .take(pageSize)
          .getMany();
      }

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

  async getBalanceHistory(address: string): Promise<any> {
    try {
      const balanceHistory = await this.balanceHistoryRepository
        .createQueryBuilder('balanceHistory')
        .where('balanceHistory.address = :address', { address })
        .orderBy({
          id: 'ASC',
        })
        .getMany();

      return balanceHistory;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
