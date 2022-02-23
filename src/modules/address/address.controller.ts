import { Controller, Get, Param, Query } from '@nestjs/common';
// import { GetAddressDto, GetAddressListDto } from './dto';
import { AddressService } from './address.service';
// import { AddressListRO, AddressRO, LatestAddressHeightRO } from './block.interface';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from 'src/exceptions';

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
  async getTransactionList(@Param() params, @Query() query: any): Promise<any> {
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
        true,
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
        false,
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
