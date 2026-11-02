import { SchemaContract } from '../SchemaContract'
import { BelongsToManyField, ColumnField, Entity, EntityConstructor, EntityMetadata, Expression, PrimaryField } from '../..'
import { ColumnDefinitionOptions } from '.'
import { Create } from './Create'
import { AddColumn, AddForeignKey, AddIdentity, AddPrimaryKey, Alter, AlterColumnType, DropColumn } from './Alter'

export abstract class Schema extends SchemaContract {

    // tslint:disable-next-line:no-any
    protected abstract typesMatches: Map<any, string>

    async create(table: string, columns: ColumnField<Entity>[]) {
        const columnsDefinitions = columns.map(column => this.columnMetadataToColumnDefinition(column))

        await this.driver.run(this.createStatement(table, columnsDefinitions).toSQL())
    }

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

        await this.syncForeignKeys(entitiesMetadata)
    }

    columnMetadataToColumnDefinition(metadata: ColumnField<Entity>): ColumnDefinitionOptions {
        return {
            name: metadata.column,
            primaryKey: metadata.constructor === PrimaryField,
            autoIncrement: Number(metadata.constructor === PrimaryField),
            type: this.getColumnTypeBasedOnTypescriptType(metadata),
            default: undefined,
            nullable: true
        }
    }

    /**
     * Alters columns in place. Statements default to standard SQL; dialects override the ones they spell differently.
     */
    protected async syncTableColumns(table: string, columnsMetadata: ColumnField<Entity>[]) {
        const columns = columnsMetadata.map(metadata => this.columnMetadataToColumnDefinition(metadata))

        const tableColumns = await this.driver.tableColumns(table)

        let alters: Expression[] = []

        alters = alters.concat(
            columns
                .whereNotIn('name', tableColumns.pluck('name'))
                .map(column => this.addColumn({...column, autoIncrement: undefined}))
        )

        columns.whereIn('name', tableColumns.pluck('name'))
            .forEach(column => {
                const typeInDB = tableColumns.findWhere('name', column.name)?.type
                if (typeInDB !== column.type) {
                    alters.push(this.changeColumnType(column))
                }
            })

        alters = alters.concat(
            tableColumns
                .whereNotIn('name', columns.pluck('name'))
                .map(tableColumn => new DropColumn(tableColumn.name))
        )

        if (!alters.empty()) {
            await this.driver.run(new Alter(table, alters).toSQL())
        }

        const additionalAlters: Expression[] = []
        columns.forEach(column => {
            const dbInfo = tableColumns.findWhere('name', column.name)
            if (column.primaryKey && !dbInfo?.primaryKey) {
                additionalAlters.push(this.addPrimaryKey(column))
            }
            if (column.autoIncrement && !dbInfo?.autoIncrement) {
                additionalAlters.push(this.addAutoIncrement(column))
            }
        })

        if (!additionalAlters.empty()) {
            await this.driver.run(new Alter(table, additionalAlters).toSQL())
        }
    }

    /**
     * Runs after every table exists, since a relation can point to a table created later.
     * Relations to entities outside this synchronization are skipped.
     */
    protected async syncForeignKeys(entitiesMetadata: EntityMetadata<Entity, Entity>[]) {
        const tables = entitiesMetadata.pluck('table')
        for (const metadata of entitiesMetadata) {
            const table = metadata.table as string
            const relationships = Object.values(metadata.relationships).filter(field => tables.includes(field.related.getTable()))
            if (relationships.empty()) {
                continue
            }

            const foreignKeys = await this.driver.tableForeignKeys(table)
            const missing = relationships.filter(field => !foreignKeys.includes(field.column))
            if (!missing.empty()) {
                await this.driver.run(new Alter(table, missing.map(field => new AddForeignKey(
                    table,
                    field.column,
                    field.related.getTable(),
                    field.related.getPrimaryKey() as string
                ))).toSQL())
            }
        }
    }

    protected createStatement(table: string, columns: ColumnDefinitionOptions[]): Expression {
        return new Create(table, columns)
    }

    protected addColumn(column: ColumnDefinitionOptions): Expression {
        return new AddColumn(column)
    }

    protected changeColumnType(column: ColumnDefinitionOptions): Expression {
        return new AlterColumnType(column)
    }

    protected addAutoIncrement(column: ColumnDefinitionOptions): Expression {
        return new AddIdentity(column)
    }

    protected addPrimaryKey(column: ColumnDefinitionOptions): Expression {
        return new AddPrimaryKey(column)
    }

    private getColumnTypeBasedOnTypescriptType(column: ColumnField<Entity>) {
        const typePrototype = Array.from(this.typesMatches.keys())
            .find(key => column.type().prototype instanceof key) || String

        // The field class wins: a JSONField is declared as String but stores unlimited text
        return this.typesMatches.get(column.constructor)
            ?? this.typesMatches.get(column.type())
            ?? this.typesMatches.get(typePrototype)
            ?? this.typesMatches.get(String) as string
    }
}
