import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from 'src/exceptions';

import { DashboardService } from './dashboard.service';

@Controller('dashboard')
class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  async getDashboardInfo(): Promise<any> {
    let result: any;

    try {
      result = await this.dashboardService.getDashboardInfo();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get('daily')
  async getDailyInfo(): Promise<any> {
    let result: any;

    try {
      result = await this.dashboardService.getDailyInfo();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }
}

export { DashboardController };
