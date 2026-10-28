import { Schema as BaseSchema } from '../SQL/Schema'
import { Create } from './Create'
import { typesMatches } from '.'
import { ColumnDefinitionOptions } from '../SQL'
import { AddColumn, AddConstraint, Constraints, ModifyColumn } from './Alter'

export class Schema extends BaseSchema {

    protected typesMatches = typesMatches

    protected createStatement(table: string, columns: ColumnDefinitionOptions[]) {
        return new Create(table, columns)
    }

    protected addColumn(column: ColumnDefinitionOptions) {
        return new AddColumn(column)
    }

    protected changeColumnType(column: ColumnDefinitionOptions) {
        return new ModifyColumn(column)
    }

    protected addAutoIncrement(column: ColumnDefinitionOptions) {
        return new ModifyColumn(column)
    }

    protected addPrimaryKey(column: ColumnDefinitionOptions) {
        return new AddConstraint(column, Constraints.PrimaryKey)
    }
}
