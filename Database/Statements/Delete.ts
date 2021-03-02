import { Statement } from './Statement'

export class Delete extends Statement {

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
