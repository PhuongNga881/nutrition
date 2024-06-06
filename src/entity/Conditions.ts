import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { userConditions } from './UserConditions';
@Entity('conditions')
export class Conditions {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'calories' })
  calorie: number;

  @Column({ name: 'protein' })
  protein: number;

  @Column({ name: 'carbs', nullable: true })
  carbs: number;

  @Column({ name: 'fat' })
  fat: number;
  @Column({ name: 'Description', nullable: true })
  Description: string;

  @OneToMany(() => userConditions, (userCondition) => userCondition.condition)
  userCondition: userConditions[];
}
