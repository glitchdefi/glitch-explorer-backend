import { Controller, Get } from '@nestjs/common';
import { CoinService } from './coin.service';

@Controller('coins')
class CoinController {
  constructor(private coinService: CoinService) {}

  @Get('markets')
  async getMarkets(): Promise<any> {
    return this.coinService.getMarkets();
  }

  @Get('market_chart')
  async getMarketChart(): Promise<any> {
    return this.coinService.getMarketChart();
  }
}

export { CoinController };
