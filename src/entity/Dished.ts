import {
  Column,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DishIngredients } from './DishIngredients';
import { MealRecipe } from './MealRecipe';
@Entity('dishes')
export class Dished {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'name' })
  name: string;
  @Column('bigint', { name: 'UserID' })
  UserID: number;
  @Column('bool', { name: 'is_all' })
  isAll: boolean;
  @Column({ name: 'code' })
  code: number;

  @Column({ name: 'protein' })
  protein: number;

  @Column({ name: 'carbs', nullable: true })
  carbs: number;

  @Column({ name: 'fat' })
  fat: number;
  @Column({ name: 'Description', nullable: true })
  Description: string;

  @OneToMany(() => DishIngredients, (dishIngredient) => dishIngredient.Dish)
  dishIngredients: DishIngredients[];
  @OneToMany(() => MealRecipe, (mealRecipe) => mealRecipe.dish)
  mealRecipe: MealRecipe[];
  @DeleteDateColumn({ name: 'deleteAt' })
  deleteAt?: Date;
  @Column({ name: 'deleteBy' })
  deleteBy?: string;
}
