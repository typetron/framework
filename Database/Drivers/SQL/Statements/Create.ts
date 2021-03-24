import { BaseStatement } from './BaseStatement'
import { ColumnField, Entity } from '@Typetron/Database'

export class Create extends BaseStatement {

    columns: ColumnField<Entity>[] = []

    getColumns() {
        return ''
    }

    toSql() {
        return `
            CREATE
            TABLE
            ${this.table}
            (
                ${this.getColumns()}
            )
        `
    }
}
