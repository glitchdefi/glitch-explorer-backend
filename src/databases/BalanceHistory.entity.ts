import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ name: 'balance_history' })
export class BalanceHistory {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Index()
  @Column({ name: 'address' })
  address: string;

  @Index()
  @Column({ name: 'balance', type: 'numeric', default: 0 })
  balance: string;

  @Index()
  @Column({ name: 'block_index' })
  blockIndex: number;

  @Column({ name: 'time', type: 'timestamptz' })
  time: Date;

  @Index()
  @Column({ name: 'fetch_status', nullable: true })
  fetchStatus: number;

  @Column({ name: 'header_hash', nullable: true })
  headerHash: string;
}
