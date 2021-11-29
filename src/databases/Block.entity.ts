import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Log } from 'src/databases/Log.entity';
import { Extrinsic } from 'src/databases/Extrinsic.entity';

@Entity({ name: 'block' })
export class Block {
  @PrimaryColumn({ name: 'index' })
  index: number;

  @Column({ name: 'hash' })
  hash: string;

  @Column({ name: 'parent_hash' })
  parentHash: string;

  @Column({ name: 'validator' })
  validator: string;

  @Column({ name: 'epoch' })
  epoch: number;

  @Column({ name: 'weight' })
  weight: number;

  @Column({ name: 'time', type: 'timestamptz' })
  time: Date;

  @Column({ name: 'reward' })
  reward: string;

  @Column({ name: 'extrinsic_hash' })
  extrinsicHash: string;

  @Column({ name: 'era_index' })
  eraIndex: number;

  @OneToOne(() => Extrinsic, (extrinsic: Extrinsic) => extrinsic.block)
  extrinsic: Extrinsic;

  @OneToMany(() => Log, (log: Log) => log.blockIndex)
  logs?: Log[];
}
