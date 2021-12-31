import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Block } from './Block.entity';

@Entity({ name: 'log' })
export class Log {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;
  @Index()
  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'consensus_engine_id' })
  ConsensusEngineId: string;

  @Column({ name: 'byte' })
  byte: string;

  @ManyToOne(() => Block, (block: Block) => block.logs)
  @Index()
  @JoinColumn({ name: 'block_index' })
  blockIndex: Block;
}
