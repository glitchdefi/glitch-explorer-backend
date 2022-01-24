import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Address } from '../../databases';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    @Inject('ADDRESS_REPOSITORY')
    private addressRepository: Repository<Address>,
  ) {}

  async getAddressList(pageSize: number, pageIndex: number): Promise<any> {
    try {
      const addressCount = await this.getAddressCount();
      const addresses = await this.addressRepository
        .createQueryBuilder('address')
        .orderBy('id', 'DESC')
        .skip((pageIndex - 1) * pageSize)
        .take(pageSize)
        .getMany();

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
      const account = await this.addressRepository.findOne({
        where: [{ address: address }, { evmAddress: address }],
      });

      if (!account) return null;

      return {
        ...account,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
