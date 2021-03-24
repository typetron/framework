import { BaseStatement } from './BaseStatement'

export class Delete extends BaseStatement {

    get wheres() {
        if (!this.components.wheres.length) {
            return ''
        }

        return `WHERE ` + super.wheres
    }

    toSql() {
        return `
            DELETE FROM ${this.table}
            ${this.wheres}
            ${this.orders}
            ${this.limit}
        `
    }

}
