import { Controller, Get, Query } from '@nestjs/common';
import { LogService } from './log.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from 'src/exceptions';

@Controller('log')
export class LogController {
  constructor(private logService: LogService) {}

  @Get('list')
  async getLogList(@Query() query: any): Promise<any> {
    const pageSize = Number(query.page_size) || 15;
    const pageIndex = Number(query.page_index) || 1;

    if (pageSize <= 0 || pageIndex <= 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.logService.getLogList(pageSize, pageIndex);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get('count')
  async getLogCount(): Promise<number> {
    let result: number;

    try {
      result = await this.logService.getLogCount();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }
}
