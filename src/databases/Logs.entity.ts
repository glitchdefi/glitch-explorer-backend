import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Blocks } from 'src/databases/Blocks.entity';

@Entity()
export class Logs {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  title: string;

  @Column()
  ConsensusEngineId: string;

  @Column()
  byte: string;

  @ManyToOne(() => Blocks, (blocks: Blocks) => blocks.logs)
  @JoinColumn({ name: 'blockIndex' })
  blockIndex: Blocks;
}
