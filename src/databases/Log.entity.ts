import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Block } from 'src/databases/Block.entity';

@Entity({ name: 'log' })
export class Log {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;
  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'consensus_engine_id' })
  ConsensusEngineId: string;

  @Column({ name: 'byte' })
  byte: string;

  @ManyToOne(() => Block, (block: Block) => block.logs)
  @JoinColumn({ name: 'block_index' })
  blockIndex: Block;
}
