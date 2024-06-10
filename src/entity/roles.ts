import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Users } from './Users';
@Entity('roles')
export class Roles {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'name' })
  name: string;
  @OneToMany(() => Users, (user) => user.roles)
  users: Users[];
}
