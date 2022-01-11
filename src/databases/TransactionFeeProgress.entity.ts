import { Column, Entity, PrimaryColumn, Index } from 'typeorm';
enum ProgressType {
  done = 1,
  pending = 0
}

@Entity({ name: 'transaction_fee_progress' })
export class TransactionFeeProgress {
  @PrimaryColumn({ name: 'ex_hash' })
  exHash: string;

  @Index()
  @Column({ name: 'block_hash' })
  blockHash: string;

  @Index()
  @Column({ name: 'tx_hash' })
  txHash: string;

  @Column('enum', { name: 'status', enum: ProgressType })
  status: ProgressType;
}
