import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from 'src/exceptions';
// import { GetTransactionsByHeightDto, GetTransactionsDto } from './dto';
// import { GetTransactionListDto } from './dto/getTransactionList.dto';
// import { BlockTransactionsRO, TransactionRO } from './transaction.interface';

import { TransactionService } from './transaction.service';

@Controller('tx')
class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Get('list')
  async getTransactionList(@Query() query: any): Promise<any> {
    const pageSize = Number(query.page_size) || 15;
    const pageIndex = Number(query.page_index) || 1;

    if (pageSize <= 0 || pageIndex <= 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.transactionService.getTransactionList(
        pageSize,
        pageIndex,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get('count')
  async getTransactionCount(): Promise<number> {
    let result: number;

    try {
      result = await this.transactionService.getTransactionCount();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get(':hash')
  async getTransaction(@Param() params): Promise<any> {
    const hash = params.hash;

    let result: any;

    try {
      result = await this.transactionService.getTransaction(hash);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (!result) return {};

    return result;
  }

  @Get('latest')
  async getLatestTransaction(): Promise<any | any> {
    let result: any;

    try {
      result = await this.transactionService.getLatestTransaction();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (!result) return {};

    return result;
  }
}

@Controller('block_tx')
class BlockTransactionController {
  constructor(private transactionService: TransactionService) {}

  @Get(':height')
  async getTransactionsByHeight(
    @Param() params,
    @Query() query: any,
  ): Promise<any> {
    const height = Number(params.height);
    const pageSize = Number(query.size) || 15;
    const pageIndex = Number(query.page) || 1;

    if (height < 0 || pageSize <= 0 || pageIndex <= 0)
      throw new BadRequestException();

    let result: any;

    try {
      result = await this.transactionService.getTransactionsByHeight(
        height,
        pageSize,
        pageIndex,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get()
  async getTransactions(@Query() query: any): Promise<any> {
    const height = Number(query.height);
    const pageSize = Number(query.size) || 15;
    const pageIndex = Number(query.page) || 1;

    if (Number.isNaN(height) || height < 0 || pageSize <= 0 || pageIndex <= 0)
      throw new BadRequestException();

    if (height <= 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.transactionService.getTransactionsByHeight(
        height,
        pageSize,
        pageIndex,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }
}

export { TransactionController, BlockTransactionController };
