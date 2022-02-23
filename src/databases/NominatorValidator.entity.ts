import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity({ name: 'nominator_validator' })
export class NominatorValidator {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Index()
  @Column({ name: 'nominator', nullable: false })
  nominator: string;

  @Index()
  @Column({ name: 'validator', nullable: false })
  validator: string;


  @Index()
  @Column({ name: 'era', default: 0 })
  era: number;

  @Index()
  @Column({ name: 'submitted_era', default: 0 })
  submittedEra: number;
}
