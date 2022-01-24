import { Controller, Get, Query } from '@nestjs/common';
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

  // @Get('count')
  // async getAddressCount(): Promise<number> {
  //   let result: number;

  //   try {
  //     result = await this.blockService.getAddressCount();
  //   } catch (error) {
  //     throw new InternalServerErrorException();
  //   }

  //   return result;
  // }

  // @Get()
  // async getAddress(@Query() query: any): Promise<any> {
  //   const height = Number(query?.height);

  //   if (Number.isNaN(height) || height <= 0) throw new BadRequestException();

  //   let result: any;

  //   try {
  //     result = await this.blockService.getAddress(height);
  //   } catch (error) {
  //     throw new InternalServerErrorException();
  //   }

  //   if (!result) return {};

  //   return result;
  // }

  // @Get('head_block_number')
  // async getLatestAddressHeight(): Promise<any> {
  //   let result: any;

  //   try {
  //     result = await this.blockService.getLatestAddressHeight();
  //   } catch (error) {
  //     throw new InternalServerErrorException();
  //   }

  //   if (!result) throw new NotFoundException();

  //   return result;
  // }
}
