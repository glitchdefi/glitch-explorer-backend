import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Extrinsic } from './Extrinsic.entity';

@Entity({ name: 'transaction' })
export class Transaction {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'hash' })
  hash: string;
  @Index()
  @Column({ name: 'from' })
  from: string;
  @Index()
  @Column({ name: 'to' })
  to: string;

  @Column({ name: 'value' })
  value: string;

  @Column({ name: 'weight' })
  weight: string;
  @Index()
  @Column({ name: 'type' })
  type: string;

  @Column({ name: 'fee' })
  fee: string;

  @Column({ name: 'tip' })
  tip: string;
  @Index()
  @Column({ name: 'status', default: "success" })
  status: string;
  @Index()
  @Column({ name: 'block_index', default: -1 })
  blockIndex: number;

  @Column({ name: 'time', type: 'timestamptz' })
  time: Date;
  

  @ManyToOne(() => Extrinsic, (extrinsic: Extrinsic) => extrinsic.tx, {
    eager: true,
    cascade: true,
  })
  @Index()
  @JoinColumn({ name: 'extrinsic_index' })
  extrinsicIndex?: Extrinsic;
}
