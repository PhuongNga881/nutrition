import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MealRecipe } from './MealRecipe';
import { Users } from './Users';
@Entity('meals')
export class Meals {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'name' })
  name: string;
  @Column('bigint', { name: 'UserID' })
  userID: number;
  @Column({ name: 'Description', nullable: true })
  Description: string;
  @Column('timestamp', { name: 'dateMeal', nullable: true })
  dateMeal: Date;
  @OneToMany(() => MealRecipe, (mealRecipe) => mealRecipe.meal)
  mealRecipe: MealRecipe[];
  @ManyToOne(() => Users, (user) => user.meals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserID', referencedColumnName: 'id' })
  User: Users;
}
