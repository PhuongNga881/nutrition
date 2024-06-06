import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Dished } from './Dished';
import { Meals } from './Meal';
@Entity('mealrecipes')
export class MealRecipe {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'MealID' })
  mealId: number;
  @Column({ name: 'DishID', nullable: true })
  dishId: number;
  @Column({
    name: 'Quantity',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: false,
  })
  Quantity: number;
  @ManyToOne(() => Dished, (dish) => dish.mealRecipe, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'DishID', referencedColumnName: 'id' })
  dish: Dished;

  @ManyToOne(() => Meals, (meal) => meal.mealRecipe, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'MealID', referencedColumnName: 'id' })
  meal: Meals;
}
