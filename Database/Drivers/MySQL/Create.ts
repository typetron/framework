import { BaseStatement } from '../SQL/Statements/BaseStatement'
import { ColumnDefinitionOptions } from '../SQL'
import { wrap } from '../../Helpers'

export class Create extends BaseStatement {

    constructor(table: string, public columns: ColumnDefinitionOptions[] = []) {
        super({
            table,
            columns: [],
            joins: [],
            wheres: [],
            groups: [],
            orders: [],
            having: []
        })
    }

    toSQL() {
        const definitions: string[] = this.getColumnsSQL(this.columns)

        this.columns.where('primaryKey').whenNotEmpty(primaryColumns => {
            definitions.push(`PRIMARY KEY (${primaryColumns.pluck('name').join(', ')})`)
        })

        return `
            CREATE TABLE ${this.table}
            (
                ${definitions.join(', \n')}
            )
        `
    }

    private getColumnsSQL(columns: ColumnDefinitionOptions[]) {
        return columns.map(this.getColumnSQL)
    }

    private getColumnSQL(column: ColumnDefinitionOptions) {
        const sqlParts = [wrap(column.name), column.type]

        if (column.autoIncrement) {
            sqlParts.push('AUTO_INCREMENT')
        }

        return sqlParts.join(' ')
    }
}
