import { Column, Entity, EntityColumns, ID, PrimaryColumn } from '../../Database'
import { Authenticatable } from './Authenticatable'

export class User extends Entity implements Authenticatable<User> {

    @PrimaryColumn()
    id: ID

    @Column()
    email: string

    @Column()
    password: string

    getId(): EntityColumns<User> {
        return 'id'
    }

    getPassword(): EntityColumns<User> {
        return 'password'
    }

    getUsername(): EntityColumns<User> {
        return 'email'
    }

}
