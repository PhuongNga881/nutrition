import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './Users';
import { userConditions } from './UserConditions';
@Entity('usergoals')
export class UserGoals {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column('bigint', { name: 'userId' })
  userId: number;
  @Column({ name: 'BMR' })
  BMR: number;

  @Column({ name: 'sex' })
  sex: boolean;

  @Column({ name: 'age' })
  age: number;

  @Column({ name: 'weight' })
  weight: number;
  @Column({ name: 'possible_pregnancy' })
  possiblePregnancy: number;
  @Column({ name: 'TEE' })
  TEE: number;
  @Column({ name: 'TDEE' })
  TDEE: number;
  @Column('varchar', { name: 'exercise' })
  exercise: string;
  @Column({ name: 'BMI' })
  BMI: number;
  @Column({ name: 'Description', nullable: true })
  Description: string;
  @OneToMany(() => userConditions, (usercondition) => usercondition.userGoals)
  userCondition: userConditions[];
  @ManyToOne(() => Users, (user) => user.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  User: Users;
}
