import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ name: 'balance_history' })
export class BalanceHistory {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Index()
  @Column({ name: 'address' })
  address: string;

  @Column({ name: 'balance' })
  balance: string;

  @Index()
  @Column({ name: 'block_index' })
  blockIndex: number;

  @Column({ name: 'time', type: 'timestamptz' })
  time: Date;
  @Column( { name: 'fetch_status' })
  fetchStatus: number;
  
  @Column({ name: 'header_hash' })
  headerHash: string;
}
