import {
  Column,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsEmail } from 'class-validator';
import { Dished } from './Dished';
import { Meals } from './Meal';
import { userConditions } from './UserConditions';
import { UserGoals } from './UserGoals';
@Entity('users')
export class Users {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'Name' })
  name: string;

  @Column({ name: 'UserName' })
  userName: string;

  @Column({ name: 'Password' })
  password: string;

  @IsEmail()
  @Column({ name: 'Email', nullable: true })
  email?: string;
  @OneToMany(() => Dished, (dish) => dish.User)
  dishes: Dished[];
  @OneToMany(() => Meals, (meal) => meal.User)
  meals: Meals[];
  @OneToMany(() => userConditions, (usercondition) => usercondition.user)
  userCondition: userConditions[];
  @OneToMany(() => UserGoals, (goal) => goal.User)
  goals: UserGoals[];
  @DeleteDateColumn({ name: 'deletedAt' })
  deletedAt?: Date;
  @Column({ name: 'deleteBy' })
  deleteBy?: string;
}
