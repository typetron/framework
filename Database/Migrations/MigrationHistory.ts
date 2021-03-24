import { Column, CreatedAt, ID, Options, PrimaryColumn } from '../Decorators'
import { Entity } from '../Entity'

@Options({
    table: 'migration_history'
})
export class MigrationHistory extends Entity {

    @PrimaryColumn()
    id: ID

    @Column()
    name: string

    @Column()
    batch: number

    @CreatedAt()
    createdAt: Date
}
