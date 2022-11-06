import { BaseStatement } from './BaseStatement'
import { ColumnField, Entity } from '../../..'

export class Alter extends BaseStatement {

    columns: ColumnField<Entity>[] = []

    getColumns() {
        return ''
    }

    toSQL() {
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
