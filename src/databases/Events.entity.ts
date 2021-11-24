import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Blocks } from 'src/databases/Blocks.entity';

@Entity()
export class Events {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hash: string;

  @Column()
  name: string;

  @Column()
  source: string;

  @Column()
  from: string;

  @Column()
  to: string;

  @ManyToOne(() => Blocks, (blocks: Blocks) => blocks.events)
  @JoinColumn({ name: 'blockIndex' })
  blockIndex: Blocks;
}
