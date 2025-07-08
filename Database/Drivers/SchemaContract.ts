import { ColumnField, Entity, EntityMetadata } from '..'
import { DatabaseDriver } from './DatabaseDriver'

export abstract class SchemaContract {
    constructor(public driver: DatabaseDriver) {}

    abstract create(table: string, columns: ColumnField<Entity>[]): Promise<void>

    abstract synchronize(entitiesMetadata: EntityMetadata<Entity, Entity>[]): Promise<void>

}
