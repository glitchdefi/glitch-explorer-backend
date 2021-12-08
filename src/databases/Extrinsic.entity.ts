import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './Transaction.entity';
import { Event } from './Event.entity';
import { Block } from './Block.entity';

@Entity({ name: 'extrinsic' })
export class Extrinsic {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'hash' })
  hash: string;

  @OneToOne(() => Block, {
    eager: true,
    cascade: true,
  })
  @JoinColumn({ name: 'block_index' })
  block: Block;

  @OneToMany(() => Event, (event: Event) => event.extrinsicIndex)
  event?: Event[];

  @OneToMany(
    () => Transaction,
    (transaction: Transaction) => transaction.extrinsicIndex,
  )
  tx?: Transaction[];
}
