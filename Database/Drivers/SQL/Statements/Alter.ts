import { BaseStatement } from './BaseStatement'
import { ColumnField, Entity } from '@Typetron/Database'

export class Alter extends BaseStatement {

    columns: ColumnField<Entity>[] = []

    getColumns() {
        return ''
    }

    toSql() {
        return `
            ALTER
            TABLE
            ${this.table}
            (
                ${this.getColumns()}
            )
        `
    }
}
