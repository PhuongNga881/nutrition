import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('type_intolerances')
export class TypeIntolerances {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column('bigint', { name: 'intolerances_id' })
  intolerancesId: string;

  @Column('bigint', { name: 'object_id' })
  objectId: number;

  @Column('varchar', { name: 'type' })
  type: string;
}
