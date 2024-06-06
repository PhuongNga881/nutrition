import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from './Users';
import { Conditions } from './Conditions';
@Entity('userConditions')
export class userConditions {
  @PrimaryGeneratedColumn({ name: 'ID' })
  ID: number;

  @Column({ name: 'userID' })
  userID: number;

  @Column({ name: 'ConditionID' })
  ConditionID: number;

  @ManyToOne(() => Users, (user) => user.userCondition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userID', referencedColumnName: 'id' })
  user: Users;

  @ManyToOne(() => Conditions, (condition) => condition.userCondition, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ConditionID', referencedColumnName: 'id' })
  condition: Conditions;
}
