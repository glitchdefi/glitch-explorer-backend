import { Controller, Get, Query } from '@nestjs/common';
import { InternalServerErrorException } from 'src/exceptions';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  async search(@Query() query: any): Promise<any> {
    const term = query.term;

    if (!term) return null;

    let result;

    try {
      result = await this.searchService.search(term);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return result;
  }
}
