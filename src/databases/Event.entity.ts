import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Extrinsic } from 'src/databases/Extrinsic.entity';

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

  @Column({ name: 'from' })
  from: string;

  @Column({ name: 'to' })
  to: string;

  @ManyToOne(() => Extrinsic, (extrinsic: Extrinsic) => extrinsic.event, {
    eager: true,
    cascade: true,
  })
  @JoinColumn({ name: 'extrinsic_index' })
  extrinsicIndex: Extrinsic;
}
