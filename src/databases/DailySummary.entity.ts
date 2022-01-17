import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
} from 'typeorm';
@Entity({ name: 'daily_summary' })
export class DailySummary {
  @PrimaryColumn({ name: 'time', type: 'timestamptz' })
  time: Date;

  @Index()
  @Column({ name: 'tx_count', default: 0 })
  txCount: number;
  
  @Index()
  @Column({ name: 'new_acc', default: 0 })
  newAcc: number;

  @Index()
  @Column({ name: 'block_start', default: 0 })
  blockStart: number;

  @Index()
  @Column({ name: 'block_end', default: 0 })
  blockEnd: number;

  @Index()
  @Column({ name: 'ave_block_time', type: 'float', default: 0 })
  aveBlockTime: number;

  // @Index()
  // @Column({ name: 'status', default: 0 })
  // status: number
}
