import { Controller, Get, Param, Query } from '@nestjs/common';
// import { GetAddressDto, GetAddressListDto } from './dto';
import { AddressService } from './address.service';
// import { AddressListRO, AddressRO, LatestAddressHeightRO } from './block.interface';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from 'src/exceptions';
import { GetTransactionListDto } from './dto';

@Controller('address')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get('list')
  async getAddressList(@Query() query: any): Promise<any> {
    const pageSize = Number(query.page_size) || 15;
    const pageIndex = Number(query.page_index) || 1;

    if (pageSize <= 0 || pageIndex <= 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.addressService.getAddressList(pageSize, pageIndex);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get(':hash')
  async getAddress(@Param() params): Promise<any> {
    const hash = params.hash;

    let result: any;

    try {
      result = await this.addressService.getAddress(hash);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (!result) return {};

    return result;
  }

  @Get(':hash/tx')
  async getTransactionList(
    @Param() params,
    @Query() query: GetTransactionListDto,
  ): Promise<any> {
    const hash = params.hash;
    const pageSize = Number(query.page_size) || 15;
    const pageIndex = Number(query.page_index) || 1;
    const startDate = query.start_date;
    const endDate = query.end_date;
    const type = query.type;
    const status = query.status;

    if (pageSize <= 0 || pageIndex <= 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.addressService.getTransactionList(
        hash,
        pageSize,
        pageIndex,
        startDate,
        endDate,
        type,
        status,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get(':hash/balance_tx')
  async getBalanceTransactionList(
    @Param() params,
    @Query() query: any,
  ): Promise<any> {
    const hash = params.hash;
    const pageSize = Number(query.page_size) || 15;
    const pageIndex = Number(query.page_index) || 1;

    if (pageSize <= 0 || pageIndex <= 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.addressService.getTransactionList(
        hash,
        pageSize,
        pageIndex,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get(':hash/balance_history')
  async getBalanceHistory(@Param() params): Promise<any> {
    const hash = params.hash;

    let result: any;

    try {
      result = await this.addressService.getBalanceHistory(hash);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get(':hash/balance')
  async getBalance(@Param() params): Promise<any> {
    const hash = params.hash;

    let result: any;

    try {
      result = await this.addressService.getBalance(hash);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (!result) throw new BadRequestException();

    return result;
  }

  @Get('/evm/:hash/balance')
  async getBalanceTest(@Param() params): Promise<string> {
    const hash = params.hash;

    let result: any;

    try {
      const glitchAddress = await this.addressService.ethereumAddressToGlitch(
        hash,
      );
      result = await this.addressService.getBalance(glitchAddress);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (!result) throw new BadRequestException();

    return result;
  }
}

@Controller('validator')
export class ValidatorController {
  constructor(private addressService: AddressService) {}

  @Get('list')
  async getAddressList(@Query() query: any): Promise<any> {
    const pageSize = Number(query.page_size) || 15;
    const pageIndex = Number(query.page_index) || 1;

    if (pageSize <= 0 || pageIndex <= 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.addressService.getValidatorList(pageSize, pageIndex);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get(':hash/nominators')
  async getNominators(@Param() params, @Query() query: any): Promise<any> {
    const hash = params.hash;
    const pageSize = Number(query.page_size) || 15;
    const pageIndex = Number(query.page_index) || 1;

    if (pageSize <= 0 || pageIndex <= 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.addressService.getNominators(
        hash,
        pageSize,
        pageIndex,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }
}

@Controller('nominator')
export class NominatorController {
  constructor(private addressService: AddressService) {}

  @Get('list')
  async getNominatorList(@Query() query: any): Promise<any> {
    const pageSize = Number(query.page_size) || 15;
    const pageIndex = Number(query.page_index) || 1;

    if (pageSize <= 0 || pageIndex <= 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.addressService.getNominatorList(pageSize, pageIndex);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get(':hash/validators')
  async getValidators(@Param() params, @Query() query: any): Promise<any> {
    const hash = params.hash;
    const pageSize = Number(query.page_size) || 15;
    const pageIndex = Number(query.page_index) || 1;

    if (pageSize <= 0 || pageIndex <= 0) throw new BadRequestException();

    let result: any;

    try {
      result = await this.addressService.getValidators(
        hash,
        pageSize,
        pageIndex,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }
}
