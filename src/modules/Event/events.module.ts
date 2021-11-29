import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from 'src/databases/Event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  controllers: [],
  providers: [],
})
export class EventsModule {}
