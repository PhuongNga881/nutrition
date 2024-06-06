import {
  Column,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DishIngredients } from './DishIngredients';
@Entity('ingredients')
export class Ingredients {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column('bigint', { name: 'code' })
  code: string;
  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'image' })
  image: string;

  @Column({ name: 'original' })
  original: string;

  @Column({ name: 'originalName' })
  originalName: string;

  @Column({ name: 'Calories' })
  calorie: number;

  @Column({ name: 'Protein' })
  protein: number;

  @Column({ name: 'Carbs', nullable: true })
  carbs: number;

  @Column({ name: 'Fat' })
  fat: number;
  @OneToMany(
    () => DishIngredients,
    (dishIngredient) => dishIngredient.Ingredient,
  )
  dishIngredients: DishIngredients[];
  @DeleteDateColumn({ name: 'deleteAt' })
  deletedAt?: Date;
  @Column({ name: 'deleteBy' })
  deleteBy?: string;
}
