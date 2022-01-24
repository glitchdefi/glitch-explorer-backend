import { AddressController } from './address.controller';
import { AddressProviders } from './address.providers';
import { AddressService } from './address.service';
import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule],
  controllers: [AddressController],
  providers: [...AddressProviders, AddressService],
})
export class AddressModule {}
