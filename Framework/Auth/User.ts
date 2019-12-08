import { Column, Entity, ID } from '../../Database';
import { Authenticable } from './Authenticable';

export class User extends Entity implements Authenticable {

    @Column()
    id: ID;

    @Column()
    email: string;

    @Column()
    password: string;

    getId = () => 'id';
    getUsername = () => 'email';
    getPassword = () => 'password';
}
