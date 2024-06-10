import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('intolerances')
export class Intolerances {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column('decimal', { name: 'name' })
  name: number;
}
