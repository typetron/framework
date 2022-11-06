import { ColumnField, Entity, PrimaryField } from '../..'
import { Schema as BaseSchema } from '../SQL/Schema'
import { Create } from './Create'
import { typesMatches } from '.'
import { ColumnDefinitionOptions } from '../SQL'
import { wrap } from '../../Helpers'

export class Schema extends BaseSchema {

    columnMetadataToColumnDefinition(metadata: ColumnField<Entity>) {
        return {
            name: metadata.column,
            primaryKey: metadata.constructor === PrimaryField,
            autoIncrement: Number(metadata.constructor === PrimaryField),
            type: this.getColumnTypeBasedOnTypescriptType(metadata),
            default: undefined,
            nullable: true
        }
    }

    async create(table: string, columns: ColumnField<Entity>[]) {
        const columnsDefinitions: ColumnDefinitionOptions[] = columns.map(column => this.columnMetadataToColumnDefinition(column))
        const createStatement = new Create(table, columnsDefinitions)

        await this.driver.run(createStatement.toSQL())
    }

    protected async syncTableColumns(table: string, columnsMetadata: ColumnField<Entity>[]) {
        const columns = columnsMetadata.map(metadata => this.columnMetadataToColumnDefinition(metadata))
        const tableColumns = await this.driver.tableColumns(table)

        if (tableColumns.length) {
            const temporaryTableName = table + '_alter_tmp'
            await this.create(temporaryTableName, columnsMetadata)
            const columnList = wrap(columns.whereIn('name', tableColumns.pluck('name')).pluck('name'))
            await this.driver.run(`INSERT INTO ${temporaryTableName}(${columnList})
                                   SELECT ${columnList}
                                   FROM ${table}`)
            await this.driver.run(`DROP TABLE ${table}`)
            await this.driver.run(`ALTER TABLE ${temporaryTableName} RENAME TO ${table}`)
        }
    }

    private getColumnTypeBasedOnTypescriptType(column: ColumnField<Entity>) {
        const typePrototype = Array.from(typesMatches.keys())
            .find(key => column.type().prototype instanceof key) || String

        return typesMatches.get(column.type())
            ?? typesMatches.get(column.constructor)
            ?? typesMatches.get(typePrototype)
            ?? typesMatches.get(String) as string
    }

}
