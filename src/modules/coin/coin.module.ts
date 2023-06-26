import { CoinController } from './coin.controller';
import { Module } from '@nestjs/common';
import { CoinService } from './coin.service';

@Module({
  controllers: [CoinController],
  providers: [CoinService],
})
export class CoinModule {}
