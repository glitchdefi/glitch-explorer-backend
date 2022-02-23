import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  Address,
  BalanceHistory,
  NominatorValidator,
  Staking,
  Transaction,
} from '../../databases';

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
        ORDER BY a.id desc
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
          'address.glitch_address = :address OR address.evm_address = :address',
          {
            address,
          },
        )
        .getRawOne();

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
        id: account['address_id'],
        glitch_address: account['address_glitch_address'],
        evm_address: account['address_evm_address'],
        balance: account['address_balance'],
        last_block_time: account['address_last_block_time'],
        address_created: account['address_address_created'],
        type: account['staking_type'],
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

  async getValidatorList(pageSize: number, pageIndex: number): Promise<any> {
    try {
      const validatorCount = Number(
        (
          await this.addressRepository.query(`WITH added_row_number AS (
            SELECT *,
              ROW_NUMBER() OVER(PARTITION BY address ORDER BY era DESC) AS row_number
            FROM staking
            WHERE type = ${StakingType.VALIDATOR}
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
          WHERE type = ${StakingType.VALIDATOR}
        )
        SELECT a.id, a.address, a.type, a.era, count(t.id) as tx_count
        FROM added_row_number a
        LEFT JOIN transaction t ON t.from = a.address OR t.to = a.address
        WHERE a.row_number = 1
        GROUP BY a.id, a.address, a.type, a.era
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
            WHERE type = ${StakingType.NOMINATOR}
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
          WHERE type = ${StakingType.NOMINATOR}
        )
        SELECT a.id, a.address, a.type, a.era, count(t.id) as tx_count
        FROM added_row_number a
        LEFT JOIN transaction t ON t.from = a.address OR t.to = a.address
        WHERE a.row_number = 1
        GROUP BY a.id, a.address, a.type, a.era
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
