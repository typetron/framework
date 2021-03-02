import { Column, Entity, ID, PrimaryColumn } from '../../Database'
import { Authenticatable } from './Authenticatable'

export class User extends Entity implements Authenticatable {

    @PrimaryColumn()
    id: ID

    @Column()
    email: string

    @Column()
    password: string

    getId = () => 'id'
    getUsername = () => 'email'
    getPassword = () => 'password'
}
