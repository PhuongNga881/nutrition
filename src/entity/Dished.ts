import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './Users';
import { DishIngredients } from './DishIngredients';
import { MealRecipe } from './MealRecipe';
@Entity('dishes')
export class Dished {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'name' })
  name: string;
  @Column('bigint', { name: 'UserID' })
  userID: number;
  @Column({ name: 'calorie' })
  calorie: number;

  @Column({ name: 'protein' })
  protein: number;

  @Column({ name: 'carbs', nullable: true })
  carbs: number;

  @Column({ name: 'fat' })
  fat: number;
  @Column({ name: 'Description', nullable: true })
  Description: string;

  @ManyToOne(() => Users, (user) => user.dishes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserID', referencedColumnName: 'id' })
  User: Users;
  @OneToMany(() => DishIngredients, (dishIngredient) => dishIngredient.Dish)
  dishIngredients: DishIngredients[];
  @OneToMany(() => MealRecipe, (mealRecipe) => mealRecipe.dish)
  mealRecipe: MealRecipe[];
  @DeleteDateColumn({ name: 'deleteAt' })
  deleteAt?: Date;
  @Column({ name: 'deleteBy' })
  deleteBy?: string;
}
