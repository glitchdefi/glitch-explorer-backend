import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
// import { Validator } from '../validator/entity';
// import { BlockListRO, BlockRO, LatestBlockHeightRO } from './block.interface';
import { Block } from '../../databases';

@Injectable()
export class BlockService {
  private readonly logger = new Logger(BlockService.name);

  constructor(
    @Inject('BLOCK_REPOSITORY')
    private blockRepository: Repository<Block>,
  ) {}

  async getBlockList(pageSize: number, pageIndex: number): Promise<any> {
    try {
      const blockCount = await this.getBlockCount();
      const blocks = await this.blockRepository
        .createQueryBuilder('block')
        .orderBy('block.index', 'DESC')
        .skip((pageIndex - 1) * pageSize)
        .take(pageSize)
        .getMany();

      return {
        data: blocks.map((block: any) => {
          return {
            ...block,
          };
        }),
        total: blockCount,
        pagination: Math.ceil(blockCount / pageSize),
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

  async getBlock(height: number): Promise<any> {
    try {
      const block = await this.blockRepository
        .createQueryBuilder('block')
        .leftJoinAndSelect('block.logs', 'logs')
        .where({
          index: height,
        })
        .getOne();

      if (!block) return null;

      return {
        ...block,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getLatestBlockHeight(): Promise<any> {
    try {
      const latestBlock = await this.blockRepository.findOne({
        order: {
          index: 'DESC',
        },
      });

      if (!latestBlock) return null;

      return { head_block_number: latestBlock.index };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
