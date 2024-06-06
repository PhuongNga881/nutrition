import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('weight_per_serving')
export class WeightPerServing {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column('decimal', { name: 'amount' })
  amount: number;

  @Column('varchar', { name: 'unit' })
  unit: string;

  @Column('bigint', { name: 'object_id' })
  objectId: number;

  @Column('varchar', { name: 'type' })
  type: string;
}
