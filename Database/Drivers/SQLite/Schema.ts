import { BelongsToManyField, ColumnField, Entity, EntityConstructor, EntityMetadata, JSONField, PrimaryField } from '@Typetron/Database'
import { wrap } from '@Typetron/Database/Helpers'
import { SchemaContract } from '../SchemaContract'

export class Schema extends SchemaContract {

    // tslint:disable-next-line:no-any
    typesMatches = new Map<any, string>([
        [Entity, 'integer'],
        [PrimaryField, `integer constraint ${String.random(9, 'abcdefghijklmnopqrstuvwxyz')} primary key autoincrement`],
        [Number, 'integer'],
        [String, 'varchar'],
        [Date, 'datetime'],
        [JSONField, 'text'],
        [Boolean, 'integer'],
    ])

    async create(table: string, columns: ColumnField<Entity>[]) {
        const columnsSQLs = columns
            .filter(column => column.column)
            .map(columnMetadata => this.getColumnSql(columnMetadata))

        await this.driver.run(`
            CREATE TABLE ${table} (
                ${columnsSQLs.join(', ')}
            )
        `)
    }

    async addColumn(table: string, column: ColumnField<Entity>) {
        await this.driver.run(`ALTER TABLE ${table} ADD ${this.getColumnSql(column)}(6)`)
    }

    async removeColumn(table: string, column: ColumnField<Entity>) {

    }

    async synchronize(entitiesMetadata: EntityMetadata<Entity>[]) {
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

    private getColumnSql(columnMetadata: ColumnField<Entity>): string {
        const columnType = columnMetadata.type()
        const type = Array.from(this.typesMatches.keys())
            .find(key =>
                key === columnMetadata.type() || columnType.prototype instanceof key || columnMetadata instanceof key
            ) || String

        const columnInfo = this.typesMatches.get(type)

        return `${columnMetadata.column} ${columnInfo}`
    }

    private async syncTableColumns(table: string, columns: ColumnField<Entity>[]) {
        const tableColumns = await this.driver.tableColumns(table)
        for await (const columnMetadata of columns) {
            const tableColumn = tableColumns.findWhere('name', columnMetadata.column)
            tableColumns.remove(tableColumn)
            if (!tableColumn) {
                await this.addColumn(table, columnMetadata)
            }
        }

        if (tableColumns.length) {
            const temporaryTableName = table + '_tmp'
            await this.create(temporaryTableName, columns)
            const columnList = wrap(columns.pluck('column'))
            await this.driver.run(`INSERT INTO ${temporaryTableName}(${columnList}) SELECT ${columnList} FROM ${table}`)
            await this.driver.run(`DROP TABLE ${table}`)
            await this.driver.run(`ALTER TABLE ${temporaryTableName} RENAME TO ${table};`)
        }
    }
}
