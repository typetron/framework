import { BaseStatement } from '../SQL/Statements/BaseStatement'
import { ColumnDefinitionOptions } from '../SQL'

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
        const sqlParts = [column.name, column.type]

        if (column.primaryKey) {
            sqlParts.push('PRIMARY KEY')
        }
        if (column.autoIncrement) {
            sqlParts.push('AUTOINCREMENT')
        }

        return sqlParts.join(' ')
    }
}
