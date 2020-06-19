import { BelongToMany, Column, Entity, PrimaryColumn } from '../../../Database';
import { User } from './User';
import { List } from '../../../Database/List';

export class Role extends Entity {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @BelongToMany(() => User, 'roles')
    users: List<User>;
}
