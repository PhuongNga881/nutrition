import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from './Users';
import { Conditions } from './Conditions';
import { UserGoals } from './UserGoals';
@Entity('userConditions')
export class userConditions {
  @PrimaryGeneratedColumn({ name: 'ID' })
  ID: number;

  @Column({ name: 'user_goal_id' })
  userGoalId: number;

  @Column({ name: 'condition_id' })
  conditionId: number;

  @ManyToOne(() => UserGoals, (user) => user.userCondition, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_goal_id', referencedColumnName: 'id' })
  userGoals: UserGoals;

  @ManyToOne(() => Conditions, (condition) => condition.userCondition, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'condition_id', referencedColumnName: 'id' })
  condition: Conditions;
}
