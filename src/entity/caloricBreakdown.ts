import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('caloric_breakdown')
export class CaloricBreakdown {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column('decimal', { name: 'percent_protein' })
  percentProtein: string;

  @Column('decimal', { name: 'percent_fat' })
  percentFat: number;

  @Column('decimal', { name: 'percent_carbs', nullable: true })
  percentCarbs: number;

  @Column('bigint', { name: 'object_id' })
  objectId: number;

  @Column('varchar', { name: 'type' })
  type: string;
}
