import { Column, CreatedAt, ID, PrimaryColumn } from '../Decorators'
import { Entity } from '../Entity'

export class MigrationHistory extends Entity {

    @PrimaryColumn()
    id: ID

    @Column()
    name: string

    @Column()
    batch: number

    @CreatedAt()
    time: Date
}
