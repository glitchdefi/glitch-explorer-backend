import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Blocks } from 'src/databases/Blocks.entity';

@Entity()
export class Transactions {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hash: string;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column()
  value: string;

  @Column()
  weight: string;

  @Column()
  type: string;

  @ManyToOne(() => Blocks, (blocks: Blocks) => blocks.tx)
  @JoinColumn({ name: 'blockIndex' })
  blockIndex: Blocks;
}
