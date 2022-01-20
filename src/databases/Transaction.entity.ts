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
  
  @Index()
  @Column({ name: 'hash' })
  hash: string;
  @Index()
  @Column({ name: 'from' })
  from: string;
  @Index()
  @Column({ name: 'to' })
  to: string;

  @Column({ name: 'value', type: "numeric", default: 0 })
  value: string;

  @Column({ name: 'weight', type: "numeric", default: 0 })
  weight: string;
  @Index()
  @Column({ name: 'type' })
  type: string;

  @Column({ name: 'fee', type: "numeric", default: 0 })
  fee: string;

  @Column({ name: 'tip', type: "numeric", default: 0 })
  tip: string;
  @Index()
  @Column({ name: 'status', default: "success" })
  status: string;
  @Index()
  @Column({ name: 'block_index', default: -1 })
  blockIndex: number;
  
  @Index()
  @Column({ name: 'time', type: 'timestamptz' })
  time: Date;
  

  @ManyToOne(() => Extrinsic, (extrinsic: Extrinsic) => extrinsic.tx, {
    eager: true,
    cascade: true,
  })
  @Index()
  @JoinColumn({ name: 'extrinsic_index' })
  extrinsicIndex?: Extrinsic;

  @Column({ name: 'ex_hash' })
  exHash: string;
  @Column( { name: 'fetch_status' })
  fetchStatus: number;
}
