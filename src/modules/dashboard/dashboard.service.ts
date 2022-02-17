import { Inject, Injectable, Logger } from '@nestjs/common';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Transaction, Address, DailySummary } from '../../databases';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private transactionRepository: Repository<Transaction>,
    @Inject('ADDRESS_REPOSITORY')
    private addressRepository: Repository<Address>,
    @Inject('DAILY_SUMMARY_REPOSITORY')
    private dailySummaryRepository: Repository<DailySummary>,
  ) {}

  async getDashboardInfo(): Promise<any> {
    try {
      const transactionCount = await this.transactionRepository
        .createQueryBuilder('transaction')
        .getCount();

      const activeAccountCount = await this.addressRepository
        .createQueryBuilder('address')
        .where({
          balance: MoreThanOrEqual(Number(process.env.MIN_BALANCE)),
        })
        .getCount();

      return {
        tx_count: transactionCount,
        active_account_count: activeAccountCount,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getDailyInfo(): Promise<any> {
    try {
      const dailyInfo = await this.dailySummaryRepository
        .createQueryBuilder('dailySummary')
        .orderBy({
          time: 'DESC',
        })
        .take(7)
        .getMany();

      return dailyInfo;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
