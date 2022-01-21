import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity({ name: 'address' })
export class Address {
  PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Index()
  @Column({ name: 'address', nullable: true })
  address: string;
  
  @Index()
  @Column({ name: 'evm_address', nullable: true })
  evmAddress: string;

  @Index()
  @Column({ name: 'balance', type: "numeric", default: 0 })
  balance: string;

  @Index()
  @Column({ name: 'last_block_index', nullable: true})
  lastBlockIndex: number;

  @Index()
  @Column({ name: 'created', type: 'timestamptz' })
  created: Date;
}
