import { ColumnField, Entity, Expression, PrimaryField } from '../..'
import { Schema as BaseSchema } from '../SQL/Schema'
import { Create } from './Create'
import { typesMatches } from '.'
import { ColumnDefinitionOptions } from '../SQL'
import { AddColumn, AddConstraint, Alter, Constraints, DropColumn, ModifyColumn } from './Alter'

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

        let alters: Expression[] = []

        alters = alters.concat(
            columns
                .whereNotIn('name', tableColumns.pluck('name'))
                .map(column => new AddColumn({...column, autoIncrement: undefined}))
        )

        columns.whereIn('name', tableColumns.pluck('name'))
            .forEach(column => {
                const typeInDB = tableColumns.findWhere('name', column.name)?.type
                if (typeInDB !== column.type) {
                    alters.push(new ModifyColumn(column))
                }
            })

        alters = alters.concat(
            tableColumns
                .whereNotIn('name', columns.pluck('name'))
                .map(tableColumn => new DropColumn(tableColumn.name))
        )

        await this.driver.run(new Alter(table, alters).toSQL())

        const additionalAlters: Expression[] = []
        columns.forEach(column => {
            const dbInfo = tableColumns.findWhere('name', column.name)
            if (column.primaryKey && !dbInfo?.primaryKey) {
                additionalAlters.push(new AddConstraint(column, Constraints.PrimaryKey))
            }
            if (column.autoIncrement && !dbInfo?.autoIncrement) {
                additionalAlters.push(new ModifyColumn(column))
            }
        })

        if (!additionalAlters.empty()) {
            await this.driver.run(new Alter(table, additionalAlters).toSQL())
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
