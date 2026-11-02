import { ColumnField, Entity } from '../..'
import { Schema as BaseSchema } from '../SQL/Schema'
import { Create } from './Create'
import { typesMatches } from '.'
import { ColumnDefinitionOptions } from '../SQL'
import { wrap } from '../../Helpers'

export class Schema extends BaseSchema {

    protected typesMatches = typesMatches

    protected createStatement(table: string, columns: ColumnDefinitionOptions[]) {
        return new Create(table, columns)
    }

    protected async syncTableColumns(table: string, columnsMetadata: ColumnField<Entity>[]) {
        const columns = columnsMetadata.map(metadata => this.columnMetadataToColumnDefinition(metadata))
        const tableColumns = await this.driver.tableColumns(table)

        if (!tableColumns.length || this.columnsSignature(columns) === this.columnsSignature(tableColumns)) {
            return
        }

        // SQLite can't alter columns in place, so the table is rebuilt in one transaction:
        // an interrupted rebuild leaves the table as it was instead of a half-copied one.
        const temporaryTableName = table + '_alter_tmp'
        const columnList = wrap(columns.whereIn('name', tableColumns.pluck('name')).pluck('name'))
        await this.driver.run('BEGIN IMMEDIATE')
        try {
            // Rebuilds interrupted before this fix could leave one behind
            await this.driver.run(`DROP TABLE IF EXISTS ${temporaryTableName}`)
            await this.create(temporaryTableName, columnsMetadata)
            await this.driver.run(`INSERT INTO ${temporaryTableName}(${columnList})
                                   SELECT ${columnList}
                                   FROM ${table}`)
            await this.driver.run(`DROP TABLE ${table}`)
            await this.driver.run(`ALTER TABLE ${temporaryTableName} RENAME TO ${table}`)
            await this.driver.run('COMMIT')
        } catch (error) {
            await this.driver.run('ROLLBACK')
            throw error
        }
    }

    /** SQLite can't add a foreign key to an existing table */
    protected async syncForeignKeys() {}

    /** Columns as SQLite declares them, so an unchanged table is left alone */
    private columnsSignature(columns: ColumnDefinitionOptions[]) {
        return columns
            .map(column => `${column.name}:${column.type.toLowerCase()}:${Number(Boolean(column.primaryKey))}`)
            .sort()
            .join(',')
    }
}
