import { BaseStatement } from './BaseStatement'
import { ColumnField, Entity } from '@Typetron/Database'

export class Create extends BaseStatement {

    columns: ColumnField<Entity>[] = []

    toSql() {
        return `
            CREATE
                TABLE
                ${this.table}
            (
                ${this.components.columns.join(', ')}
            )
        `
    }
}
