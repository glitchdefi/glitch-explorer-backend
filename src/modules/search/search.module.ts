import { SearchController } from './search.controller';
import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';
import { SearchProviders } from './search.providers';
import { SearchService } from './search.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SearchController],
  providers: [...SearchProviders, SearchService],
})
export class SearchModule {}
