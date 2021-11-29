import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from 'src/databases/Block.entity';
import { Log } from 'src/databases/Log.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([Block, Log])],
  controllers: [],
  providers: [],
})
export class BlocksModule {}
