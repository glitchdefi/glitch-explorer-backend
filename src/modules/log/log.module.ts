import { LogController } from './log.controller';
import { LogProviders } from './log.providers';
import { LogService } from './log.service';
import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule],
  controllers: [LogController],
  providers: [...LogProviders, LogService],
})
export class LogModule {}
