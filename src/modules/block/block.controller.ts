import { Controller, Get, Query } from '@nestjs/common';
// import { GetBlockDto, GetBlockListDto } from './dto';
import { BlockService } from './block.service';
// import { BlockListRO, BlockRO, LatestBlockHeightRO } from './block.interface';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from 'src/exceptions';

@Controller('block')
export class BlockController {
  constructor(private blockService: BlockService) {}

  @Get('list')
  async getBlockList(@Query() query: any): Promise<any> {
    const pageSize = Number(query.page_size) || 15;
    const pageIndex = Number(query.page_index) || 1;

    if (pageSize <= 0 || pageIndex <= 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.blockService.getBlockList(pageSize, pageIndex);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get('count')
  async getBlockCount(): Promise<number> {
    let result: number;

    try {
      result = await this.blockService.getBlockCount();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get()
  async getBlock(@Query() query: any): Promise<any> {
    const height = Number(query?.height);

    if (Number.isNaN(height) || height < 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.blockService.getBlock(height);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (!result) return {};

    return result;
  }

  @Get('head_block_number')
  async getLatestBlockHeight(): Promise<any> {
    let result: any;

    try {
      result = await this.blockService.getLatestBlockHeight();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (!result) throw new NotFoundException();

    return result;
  }

  @Get('authored_blocks')
  async getAuthoredBlockList(@Query() query: any): Promise<any> {
    const validator = query.validator;
    const pageSize = Number(query.page_size) || 15;
    const pageIndex = Number(query.page_index) || 1;

    if (!validator || pageSize <= 0 || pageIndex <= 0)
      throw new BadRequestException();

    let result: any;

    try {
      result = await this.blockService.getAuthoredBlockList(
        validator,
        pageSize,
        pageIndex,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }
}
