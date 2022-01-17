import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
enum AddressType {
  sr25519 = 1,
  sha256 = 2,
  evm_sc = 3,
}

@Entity({ name: 'address' })
export class Address {
  @PrimaryColumn({ name: 'address' })
  address: string;
  
  @Index()
  @Column('enum', { name: 'type', enum: AddressType })
  role: AddressType;

  @Index()
  @Column({ name: 'created', type: 'timestamptz' })
  created: Date;
}
