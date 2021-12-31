import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Extrinsic } from './Extrinsic.entity';

@Entity({ name: 'event' })
export class Event {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'hash' })
  hash: string;

  @Index()
  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'source' })
  source: string;

  @Index()
  @Column({ name: 'from', nullable: true  })
  from: string;

  @Index()
  @Column({ name: 'to', nullable: true })
  to: string;

  @Column({ name: 'value', nullable: true })
  value: string;

  @Column({ name: 'weight' })
  weight: string;

  @Column({ name: 'log' })
  log: string;

  @Index()
  @Column({ name: 'block_index', default: -1 })
  blockIndex: number;

  @ManyToOne(() => Extrinsic, (extrinsic: Extrinsic) => extrinsic.event, {
    eager: true,
    cascade: true,
  })
  @Index()
  @JoinColumn({ name: 'extrinsic_index' })
  extrinsicIndex: Extrinsic;
}
