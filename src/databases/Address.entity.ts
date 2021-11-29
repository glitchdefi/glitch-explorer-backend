import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
enum AddressType {
  sr25519 = 1,
  sha256 = 2,
  evm_sc = 3,
}

@Entity({ name: 'address' })
export class Address {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'address' })
  address: string;

  @Column('enum', { name: 'type', enum: AddressType })
  role: AddressType;
}
