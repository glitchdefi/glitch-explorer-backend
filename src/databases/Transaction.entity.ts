import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Extrinsic } from './Extrinsic.entity';

@Entity({ name: 'transaction' })
export class Transaction {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'hash' })
  hash: string;

  @Column({ name: 'from' })
  from: string;

  @Column({ name: 'to' })
  to: string;

  @Column({ name: 'value' })
  value: string;

  @Column({ name: 'weight' })
  weight: string;

  @Column({ name: 'type' })
  type: string;

  @Column({ name: 'fee' })
  fee: string;

  @Column({ name: 'tip' })
  tip: string;

  @Column({ name: 'time', type: 'timestamptz' })
  time: Date;

  @ManyToOne(() => Extrinsic, (extrinsic: Extrinsic) => extrinsic.tx, {
    eager: true,
    cascade: true,
  })
  @JoinColumn({ name: 'extrinsic_index' })
  extrinsicIndex?: Extrinsic;
}
