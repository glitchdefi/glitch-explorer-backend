import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Transactions } from './Transactions.entity';
import { Events } from 'src/databases/Events.entity';
import { Logs } from 'src/databases/Logs.entity';

@Entity()
export class Blocks {
  @PrimaryColumn()
  index: number;

  @Column()
  hash: string;

  @Column()
  parentHash: string;

  @Column()
  validator: string;

  @Column()
  epoch: number;

  @Column()
  weight: number;

  @Column({ type: 'timestamptz' })
  time: Date;

  @Column()
  reward: string;

  @Column()
  eraIndex: number;

  @OneToMany(
    () => Transactions,
    (transactions: Transactions) => transactions.blockIndex,
  )
  tx?: Transactions[];

  @OneToMany(() => Events, (events: Events) => events.blockIndex)
  events?: Events[];

  @OneToMany(() => Logs, (logs: Logs) => logs.blockIndex)
  logs?: Logs[];
}
