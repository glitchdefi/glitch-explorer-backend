import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Log } from './Log.entity';
import { Extrinsic } from './Extrinsic.entity';

@Entity({ name: 'block' })
export class Block {
  @PrimaryColumn({ name: 'index' })
  index: number;

  @Index()
  @Column({ name: 'hash' })
  hash: string;

  @Index()
  @Column({ name: 'parent_hash' })
  parentHash: string;

  @Index()
  @Column({ name: 'validator' })
  validator: string;

  @Column({ name: 'epoch' })
  epoch: number;

  @Column({ name: 'weight', type: "numeric", default: 0 })
  weight: string;
  
  @Index()
  @Column({ name: 'time', type: 'timestamptz' })
  time: Date;

  @Column({ name: 'reward', type: "numeric", default: 0 })
  reward: string;

  @Column({ name: 'extrinsic_hash' })
  extrinsicHash: string;

  @Index()
  @Column({ name: 'era_index' })
  eraIndex: number;

  @OneToOne(() => Extrinsic, (extrinsic: Extrinsic) => extrinsic.block)
  extrinsic: Extrinsic;

  @OneToMany(() => Log, (log: Log) => log.blockIndex)
  logs?: Log[];

  @Column({ name: 'tx_num' })
  txNum: number;
}
