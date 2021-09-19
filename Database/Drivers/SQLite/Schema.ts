import { ColumnField, Entity } from '@Typetron/Database'
import { Schema as BaseSchema } from '../SQL/Schema'

export class Schema extends BaseSchema {

    async addColumn(table: string, column: ColumnField<Entity>) {
        await this.driver.run(`ALTER TABLE ${table}
            ADD ${this.getColumnSql(column)}(6)`)
    }
}
