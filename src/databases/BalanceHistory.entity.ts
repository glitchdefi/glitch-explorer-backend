import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'balance_history' })
export class BalanceHistory {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'address' })
  address: string;

  @Column({ name: 'balance' })
  balance: string;

  @Column({ name: 'block_index' })
  blockIndex: number;

  @Column({ name: 'time', type: 'timestamptz' })
  time: Date;
}
