import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
@Entity({ name: 'address' })
export class Address {
  @PrimaryColumn({ name: 'address' })
  address: string;
  
  @Index()
  @Column({ name: 'evm_address', nullable: true })
  evmAddress: string;

  @Index()
  @Column({ name: 'balance', type: "numeric", default: 0 })
  balance: string;

  @Index()
  @Column({ name: 'created', type: 'timestamptz' })
  created: Date;
}
