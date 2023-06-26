import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class CoinService {
  private readonly logger = new Logger(CoinService.name);
  private markets = {};
  private marketChart = {};

  constructor() {
    this.fetchData();
  }

  @Interval(3600000)
  handleInterval() {
    this.fetchData();
  }

  async getMarkets(): Promise<any> {
    return this.markets;
  }

  async getMarketChart(): Promise<any> {
    return this.marketChart;
  }

  fetchData() {
    axios
      .get(
        `${process.env.COINGEKO_API_URL}/api/v3/coins/markets?vs_currency=usd&ids=glitch-protocol&order=market_cap_desc&per_page=100&page=1&sparkline=false`,
      )
      .then((response) => {
        this.markets = response.data;
      });
    axios
      .get(
        `${process.env.COINGEKO_API_URL}/api/v3/coins/glitch-protocol/market_chart?vs_currency=usd&days=365&interval=daily`,
      )
      .then((response) => {
        this.marketChart = response.data;
      });
  }
}
