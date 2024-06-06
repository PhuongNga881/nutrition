import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Dished } from './Dished';
import { Ingredients } from './Ingredients';
@Entity('dishingredients')
export class DishIngredients {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'DishID' })
  DishID: number;

  @Column({ name: 'IngredientID' })
  IngredientID: number;

  @Column({
    name: 'Quantity',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: false,
  })
  Quantity: number;

  @ManyToOne(() => Dished, (dish) => dish.dishIngredients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'DishID', referencedColumnName: 'id' })
  Dish: Dished;

  @ManyToOne(() => Ingredients, (ingredient) => ingredient.dishIngredients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'IngredientID', referencedColumnName: 'id' })
  Ingredient: Ingredients;
}
