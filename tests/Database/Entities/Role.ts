import { Column, Entity, PrimaryColumn, Relation } from '../../../Database'
import { User } from './User'
import { BelongsToMany } from '../../../Database/Fields'

export class Role extends Entity {

    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Relation(() => User, 'roles')
    users: BelongsToMany<User>
}
