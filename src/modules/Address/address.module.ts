import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from 'src/databases/Address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address])],
  controllers: [],
  providers: [],
})
export class AddressModule {}
