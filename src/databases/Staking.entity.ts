import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity({ name: 'staking' })
export class Staking {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Index()
  @Column({ name: 'address', nullable: false })
  address: string;

  @Index()
  @Column({ name: 'type', nullable: false })
  type: number;

  @Index()
  @Column({ name: 'era', default: 0 })
  era: number;

}
