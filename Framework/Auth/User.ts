import { Column, Entity, PrimaryColumn } from '../../Database'
import { Authenticable } from './Authenticable'

export class User extends Entity implements Authenticable {

    @PrimaryColumn()
    id: number

    @Column()
    email: string

    @Column()
    password: string

    getId = () => 'id'
    getUsername = () => 'email'
    getPassword = () => 'password'
}
