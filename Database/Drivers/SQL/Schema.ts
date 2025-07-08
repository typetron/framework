import { SchemaContract } from '../SchemaContract'
import { BelongsToManyField, ColumnField, Entity, EntityConstructor, EntityMetadata } from '../..'

export abstract class Schema extends SchemaContract {

    // async create(table: string, columns: ColumnField<Entity>[]) {
    //     const columnsSQLs = columns
    //         .filter(column => column.column)
    //         .map(columnMetadata => this.getColumnSql(columnMetadata))
    //
    //     // @ts-ignore
    //     const createStatement = new Create({
    //         table,
    //         columns: columnsSQLs
    //     })
    //
    //     await this.driver.run(createStatement.toSql())
    // }

    // async addColumn(table: string, column: ColumnField<Entity>) {
    //     await this.driver.run(`ALTER TABLE ${table}
    //         ADD ${this.getColumnSql(column)}(6)`)
    // }

    async synchronize(entitiesMetadata: EntityMetadata<Entity, Entity>[]) {
        const pivotTables = new Map<string, ColumnField<Entity>[]>()
        for await(const metadata of entitiesMetadata) {
            const table = metadata.table as string
            const belongsToManyFields = Object.values(metadata.inverseRelationships)
                .filter(field => field instanceof BelongsToManyField) as BelongsToManyField<Entity, Entity>[]

            belongsToManyFields.forEach(field => {
                const entity = Entity as EntityConstructor<Entity>
                const pivotTableColumns: ColumnField<Entity>[] = [
                    // new ColumnField(entity, 'id', () => PrimaryField, 'id'),
                    ...[field.getParentForeignKey(), field.getRelatedForeignKey()].sort().map(columnName => {
                        return new ColumnField(entity, columnName, () => Number, columnName)
                    })
                ]
                pivotTables.set(field.getPivotTable(), pivotTableColumns)
            })
            const tableInfo = await this.driver.tableExists(table)
            if (!tableInfo) {
                await this.create(table, Object.values({...metadata.columns, ...metadata.relationships}))
                continue
            }
            await this.syncTableColumns(table, Object.values({...metadata.columns, ...metadata.relationships}))
        }

        for await (const [name, columns] of pivotTables) {
            const tableInfo = await this.driver.tableExists(name)
            if (!tableInfo) {
                await this.create(name, columns)
                continue
            }
            await this.syncTableColumns(name, columns)
        }
    }

    protected abstract syncTableColumns(table: string, columns: ColumnField<Entity>[]): Promise<void>;

    // protected getColumnSql(columnMetadata: ColumnField<Entity>): string {
    //     const columnType = columnMetadata.type()
    //     const type = Array.from(this.typesMatches.keys())
    //         .find(key =>
    //             key === columnMetadata.type() || columnType.prototype instanceof key || columnMetadata instanceof key
    //         ) || String
    //
    //     const columnInfo = this.typesMatches.get(type)
    //
    //     return `${columnMetadata.column} ${columnInfo}`
    // }
}
