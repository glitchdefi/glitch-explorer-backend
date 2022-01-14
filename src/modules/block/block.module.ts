import { BlockController } from './block.controller';
import { BlockProviders } from './block.providers';
import { BlockService } from './block.service';
import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule],
  controllers: [BlockController],
  providers: [...BlockProviders, BlockService],
})
export class BlockModule {}
