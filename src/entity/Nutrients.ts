import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('nutrients')
export class Nutrients {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column('varchar', { name: 'name' })
  name: string;

  @Column('decimal', { name: 'amount' })
  amount: number;

  @Column('varchar', { name: 'unit' })
  unit: string;

  @Column('decimal', { name: 'percent_of_daily_needs', nullable: true })
  percentOfDailyNeeds: number;

  @Column('bigint', { name: 'object_id' })
  objectId: number;

  @Column('varchar', { name: 'type' })
  type: string;
}
