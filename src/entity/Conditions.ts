import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { userConditions } from './UserConditions';
@Entity('conditions')
export class Conditions {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'name_vn' })
  name_vn: number;
  @Column({ name: 'is_active' })
  is_active: boolean;
  @Column({ name: 'Description', nullable: true })
  Description: string;

  @OneToMany(() => userConditions, (userCondition) => userCondition.condition)
  userCondition: userConditions[];
}
