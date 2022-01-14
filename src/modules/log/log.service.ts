import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Log } from '../../databases';

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(
    @Inject('LOG_REPOSITORY')
    private logRepository: Repository<Log>,
  ) {}

  async getLogList(pageSize: number, pageIndex: number): Promise<any> {
    try {
      const logCount = await this.getLogCount();
      const logs = await this.logRepository
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.blockIndex', 'block')
        .orderBy('log.id', 'DESC')
        .skip((pageIndex - 1) * pageSize)
        .take(pageSize)
        .getMany();

      return {
        data: logs.map((log: any) => {
          const block = log.blockIndex.index;
          delete log.blockIndex;

          return {
            ...log,
            block,
          };
        }),
        total: logCount,
        pagination: Math.ceil(logCount / pageSize),
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getLogCount(): Promise<number> {
    try {
      return await this.logRepository.count();
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
