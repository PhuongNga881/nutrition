import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsEmail } from 'class-validator';
import { Meals } from './Meal';
import { UserGoals } from './UserGoals';
import { Roles } from './roles';
// import { Roles } from './roles';
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

  @Column('bigint', { name: 'role_id' })
  roleId: number;

  @IsEmail()
  @Column({ name: 'Email', nullable: true })
  email?: string;
  @OneToMany(() => Meals, (meal) => meal.User)
  meals: Meals[];
  @OneToMany(() => UserGoals, (goal) => goal.User)
  goals: UserGoals[];
  @ManyToOne(() => Roles, (role) => role.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  roles: Roles;
  @DeleteDateColumn({ name: 'deletedAt' })
  deletedAt?: Date;
  @Column({ name: 'deleteBy' })
  deleteBy?: string;
}
