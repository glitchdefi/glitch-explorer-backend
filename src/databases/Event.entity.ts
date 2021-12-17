import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Extrinsic } from './Extrinsic.entity';

@Entity({ name: 'event' })
export class Event {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'hash' })
  hash: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'source' })
  source: string;

  @Column({ name: 'from', nullable: true  })
  from: string;

  @Column({ name: 'to', nullable: true })
  to: string;

  @Column({ name: 'value', nullable: true })
  value: string;

  @Column({ name: 'weight' })
  weight: string;

  @Column({ name: 'log' })
  log: string;

  @ManyToOne(() => Extrinsic, (extrinsic: Extrinsic) => extrinsic.event, {
    eager: true,
    cascade: true,
  })
  @JoinColumn({ name: 'extrinsic_index' })
  extrinsicIndex: Extrinsic;
}
