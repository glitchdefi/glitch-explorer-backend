import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  Address,
  BalanceHistory,
  NominatorValidator,
  Staking,
  Transaction,
} from '../../databases';
import { TransactionStatus, TransactionType } from './dto';

const { ApiPromise, HttpProvider } = require('@polkadot/api');
const { encodeAddress } = require('@polkadot/util-crypto');

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    @Inject('ADDRESS_REPOSITORY')
    private addressRepository: Repository<Address>,
    @Inject('NOMINATOR_VALIDATOR_REPOSITORY')
    private nominatorValidatorRepository: Repository<NominatorValidator>,
    @Inject('TRANSACTION_REPOSITORY')
    private transactionRepository: Repository<Transaction>,
    @Inject('BALANCE_HISTORY_REPOSITORY')
    private balanceHistoryRepository: Repository<BalanceHistory>,
  ) {}

  async getAddressList(pageSize: number, pageIndex: number): Promise<any> {
    try {
      const addressCount = await this.getAddressCount();
      const addresses = await this.addressRepository.query(
        `SELECT a.*, count(t.id) AS tx_count
        FROM address a
        LEFT JOIN transaction t
          ON t.from = a.glitch_address OR t.to = a.glitch_address
            OR t.from = a.evm_address OR t.to = a.evm_address
        GROUP BY a.id
        ORDER BY a.balance desc
        LIMIT ${pageSize}
        OFFSET ${(pageIndex - 1) * pageSize}`,
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
      const account = await this.addressRepository
        .createQueryBuilder('address')
        .leftJoinAndSelect(
          Staking,
          'staking',
          'address.address = staking.address',
        )
        .where(
          'LOWER(address.glitch_address) = LOWER(:address) OR LOWER(address.evm_address) = LOWER(:address)',
          {
            address,
          },
        )
        .getRawOne();

      if (!account) return null;

      let txInfo = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('sum(value)', 'total_received')
        .where('transaction.to = :address OR transaction.to = :evmAddress', {
          address: account['address_glitch_address'],
          evmAddress: account['address_evm_address'],
        })
        .getRawOne();

      const total_received = txInfo.total_received || '0';

      txInfo = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('sum(value)', 'total_spend')
        .where(
          'transaction.from = :address OR transaction.from = :evmAddress',
          {
            address: account['address_glitch_address'],
            evmAddress: account['address_evm_address'],
          },
        )
        .getRawOne();

      const total_spend = txInfo.total_spend || '0';

      txInfo = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('count(id)', 'total_tx')
        .where(
          'transaction.from = :address OR transaction.to = :address OR transaction.from = :evmAddress OR transaction.to = :evmAddress',
          {
            address: account['address_glitch_address'],
            evmAddress: account['address_evm_address'],
          },
        )
        .getRawOne();

      const total_tx = txInfo.total_tx || '0';

      txInfo = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('time', 'last_tx_date')
        .where(
          'transaction.from = :address OR transaction.to = :address OR transaction.from = :evmAddress OR transaction.to = :evmAddress',
          {
            address: account['address_glitch_address'],
            evmAddress: account['address_evm_address'],
          },
        )
        .orderBy('block_index', 'DESC')
        .getRawOne();

      const last_tx_date = txInfo.last_tx_date;

      return {
        id: account['address_id'],
        glitch_address: account['address_glitch_address'],
        evm_address: account['address_evm_address'],
        balance: account['address_balance'],
        last_block_time: account['address_last_block_time'],
        created: account['address_created'],
        last_fetch_evm: account['address_last_fetch_evm'],
        type: account['staking_type'],
        total_received,
        total_spend,
        total_tx,
        last_tx_date,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTransactionCount(address: string): Promise<number> {
    try {
      return await this.transactionRepository
        .createQueryBuilder('transaction')
        .where(
          'LOWER(transaction.from) = LOWER(:address) OR LOWER(transaction.to) = LOWER(:address)',
          { address },
        )
        .getCount();
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTransactionList(
    address: string,
    pageSize: number,
    pageIndex: number,
    startDate?: Date,
    endDate?: Date,
    type?: TransactionType,
    status?: TransactionStatus,
  ): Promise<any> {
    try {
      const account = await this.addressRepository
        .createQueryBuilder('address')
        .where(
          'LOWER(address.glitch_address) = LOWER(:address) OR LOWER(address.evm_address) = LOWER(:address)',
          { address },
        )
        .getOne();

      if (!account)
        return {
          data: [],
          total: 0,
          pagination: 0,
        };

      let countQuery = this.transactionRepository
        .createQueryBuilder('transaction')
        .where('TRUE');
      let query = this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.extrinsicIndex', 'extrinsic')
        .leftJoinAndSelect('extrinsic.block', 'block')
        .where('TRUE');

      if (startDate) {
        countQuery = countQuery.andWhere('transaction.time >= :startDate', {
          startDate: startDate,
        });
        query = query.andWhere('transaction.time >= :startDate', {
          startDate: startDate,
        });
      }

      if (endDate) {
        countQuery = countQuery.andWhere('transaction.time <= :endDate', {
          endDate: endDate,
        });
        query = query.andWhere('transaction.time <= :endDate', {
          endDate: endDate,
        });
      }

      if (type === TransactionType.SEND) {
        countQuery = countQuery.andWhere(
          '(transaction.from = :address OR transaction.from = :evmAddress)',
          {
            address: account.address,
            evmAddress: account.evmAddress,
          },
        );
        query = query.andWhere(
          '(transaction.from = :address OR transaction.from = :evmAddress)',
          {
            address: account.address,
            evmAddress: account.evmAddress,
          },
        );
      } else if (type === TransactionType.RECEIVE) {
        countQuery = countQuery.andWhere(
          '(transaction.to = :address OR transaction.to = :evmAddress)',
          {
            address: account.address,
            evmAddress: account.evmAddress,
          },
        );
        query = query.andWhere(
          '(transaction.to = :address OR transaction.to = :evmAddress)',
          {
            address: account.address,
            evmAddress: account.evmAddress,
          },
        );
      } else {
        countQuery = countQuery.andWhere(
          '(transaction.from = :address OR transaction.to = :address OR transaction.from = :evmAddress OR transaction.to = :evmAddress)',
          {
            address: account.address,
            evmAddress: account.evmAddress,
          },
        );
        query = query.andWhere(
          '(transaction.from = :address OR transaction.to = :address OR transaction.from = :evmAddress OR transaction.to = :evmAddress)',
          {
            address: account.address,
            evmAddress: account.evmAddress,
          },
        );
      }

      if (status) {
        countQuery = countQuery.andWhere('transaction.status <= :status', {
          status: status,
        });
        query = query.andWhere('transaction.status <= :status', {
          status: status,
        });
      }

      query.orderBy('block.index', 'DESC').addOrderBy('transaction.id', 'DESC');

      query = query.take(pageSize);
      query = query.skip((pageIndex - 1) * pageSize);

      const transactionCount = Number(
        (await countQuery.select('COUNT(*) as count').getRawOne()).count,
      );
      const transactions = await query.getMany();

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

  async getBalance(address: string): Promise<any> {
    try {
      const provider = new HttpProvider(process.env.HTTP);
      const api = await ApiPromise.create({ provider });
      let account = null;

      try {
        account = (await api.query.system.account(address)).toJSON();
      } catch (error) {
        return null;
      }

      return account?.data;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getValidatorList(pageSize: number, pageIndex: number): Promise<any> {
    try {
      const validatorCount = Number(
        (
          await this.addressRepository.query(`WITH added_row_number AS (
            SELECT *,
              ROW_NUMBER() OVER(PARTITION BY address ORDER BY era DESC) AS row_number
            FROM staking
            WHERE type = ${StakingType.VALIDATOR} AND era = (SELECT MAX(era) FROM staking)
          )
          SELECT COUNT(*)
          FROM added_row_number a
          WHERE a.row_number = 1`)
        )[0].count,
      );
      const validators = await this.addressRepository.query(
        `WITH added_row_number AS (
          SELECT *,
            ROW_NUMBER() OVER(PARTITION BY address ORDER BY era DESC) AS row_number
          FROM staking
          WHERE type = ${
            StakingType.VALIDATOR
          } AND era = (SELECT MAX(era) FROM staking)
        )
        SELECT a.id, a.address, a.type, a.era, count(t.id) as tx_count, ad.evm_address, ad.balance
        FROM added_row_number a
          LEFT JOIN address ad ON ad.glitch_address = a.address
          LEFT JOIN transaction t ON t.from = a.address OR t.to = a.address OR t.from = ad.evm_address OR t.to = ad.evm_address
        WHERE a.row_number = 1
        GROUP BY a.id, a.address, a.type, a.era, ad.evm_address, ad.balance
        ORDER BY ad.balance DESC
        LIMIT ${pageSize}
        OFFSET ${(pageIndex - 1) * pageSize}`,
      );

      return {
        data: validators.map((validator: any) => {
          return {
            ...validator,
          };
        }),
        total: validatorCount,
        pagination: Math.ceil(validatorCount / pageSize),
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getNominatorList(pageSize: number, pageIndex: number): Promise<any> {
    try {
      const nominatorCount = Number(
        (
          await this.addressRepository.query(`WITH added_row_number AS (
            SELECT *,
              ROW_NUMBER() OVER(PARTITION BY address ORDER BY era DESC) AS row_number
            FROM staking
            WHERE type = ${StakingType.NOMINATOR} AND era = (SELECT MAX(era) FROM staking)
          )
          SELECT COUNT(*)
          FROM added_row_number a
          WHERE a.row_number = 1`)
        )[0].count,
      );
      const nominators = await this.addressRepository.query(
        `WITH added_row_number AS (
          SELECT *,
            ROW_NUMBER() OVER(PARTITION BY address ORDER BY era DESC) AS row_number
          FROM staking
          WHERE type = ${
            StakingType.NOMINATOR
          } AND era = (SELECT MAX(era) FROM staking)
        )
        SELECT a.id, a.address, a.type, a.era, count(t.id) as tx_count, ad.evm_address, ad.balance
        FROM added_row_number a
          LEFT JOIN address ad ON ad.glitch_address = a.address
          LEFT JOIN transaction t ON t.from = a.address OR t.to = a.address OR t.from = ad.evm_address OR t.to = ad.evm_address
        WHERE a.row_number = 1
        GROUP BY a.id, a.address, a.type, a.era, ad.evm_address, ad.balance
        ORDER BY ad.balance DESC
        LIMIT ${pageSize}
        OFFSET ${(pageIndex - 1) * pageSize}`,
      );

      return {
        data: nominators.map((nominator: any) => {
          return {
            ...nominator,
          };
        }),
        total: nominatorCount,
        pagination: Math.ceil(nominatorCount / pageSize),
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getValidators(
    nominator: string,
    pageSize: number,
    pageIndex: number,
  ): Promise<any> {
    try {
      const validators = await this.nominatorValidatorRepository
        .createQueryBuilder('nominatorValidator')
        .where('nominatorValidator.nominator = :nominator', { nominator })
        .orderBy({
          era: 'ASC',
        })
        .skip((pageIndex - 1) * pageSize)
        .take(pageSize)
        .getMany();

      return { nominator, validators };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getNominators(
    validator: string,
    pageSize: number,
    pageIndex: number,
  ): Promise<any> {
    try {
      const nominators = await this.nominatorValidatorRepository
        .createQueryBuilder('nominatorValidator')
        .where('nominatorValidator.validator = :validator', { validator })
        .orderBy({
          era: 'ASC',
        })
        .skip((pageIndex - 1) * pageSize)
        .take(pageSize)
        .getMany();

      return { validator, nominators };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}

enum StakingType {
  VALIDATOR = 0,
  NOMINATOR = 1,
}
