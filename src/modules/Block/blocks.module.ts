import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blocks } from 'src/databases/Blocks.entity';
import { Logs } from 'src/databases/Logs.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([Blocks, Logs])],
  controllers: [],
  providers: [],
})
export class BlocksModule {}
