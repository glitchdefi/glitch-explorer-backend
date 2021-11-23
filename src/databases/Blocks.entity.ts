import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Blocks {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hash: string;

  @Column()
  parentHash: string;

  @Column()
  validator: string;

  @Column()
  index: number;

  @Column()
  epoch: number;

  @Column()
  weight: number;

  @Column({ type: 'timestamptz' })
  time: Date;

  @Column()
  reward: string;
}
