import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './Users';
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

  @ManyToOne(() => Users, (user) => user.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserID', referencedColumnName: 'id' })
  User: Users;
}
