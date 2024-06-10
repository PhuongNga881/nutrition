import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('flavonoids')
export class Flavonoids {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column('varchar', { name: 'name' })
  name: string;

  @Column('decimal', { name: 'amount' })
  amount: number;

  @Column('varchar', { name: 'unit' })
  unit: string;

  @Column('bigint', { name: 'object_id' })
  objectId: number;

  @Column('varchar', { name: 'type' })
  type: string;
}
