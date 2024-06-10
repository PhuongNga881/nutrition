import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('diets')
export class Diets {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column('decimal', { name: 'name' })
  name: number;

  @Column({ name: 'Description', nullable: true })
  Description: string;
}
