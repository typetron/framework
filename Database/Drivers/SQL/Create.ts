import { BaseStatement } from './Statements/BaseStatement'
import { ColumnDefinitionOptions } from '.'
import { ColumnDefinition, ColumnDefinitionConstructor } from './ColumnDefinition'
import { wrap } from '../../Helpers'

export class Create extends BaseStatement {

    protected columnDefinition: ColumnDefinitionConstructor = ColumnDefinition

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
        const definitions: string[] = this.columns.map(column => new this.columnDefinition(column).toSQL())

        this.columns.where('primaryKey').whenNotEmpty(primaryColumns => {
            definitions.push(`PRIMARY KEY (${wrap(primaryColumns.pluck('name'))})`)
        })

        return `
            CREATE TABLE ${this.table}
            (
                ${definitions.join(', \n')}
            )
        `
    }
}
