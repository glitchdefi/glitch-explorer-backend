import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Events } from 'src/databases/Events.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Events])],
  controllers: [],
  providers: [],
})
export class EventsModule {}
