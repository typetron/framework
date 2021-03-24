import { ColumnField, Entity, EntityMetadata } from '@Typetron/Database'
import { DatabaseDriver } from './DatabaseDriver'

export abstract class SchemaContract {
    constructor(public driver: DatabaseDriver) {}

    abstract create(table: string, columns: ColumnField<Entity>[]): Promise<void>

    abstract addColumn(table: string, column: ColumnField<Entity>): Promise<void>

    abstract removeColumn(table: string, column: ColumnField<Entity>): Promise<void>

    abstract synchronize(entitiesMetadata: EntityMetadata<Entity>[]): Promise<void>

}
