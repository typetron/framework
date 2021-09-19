import { BaseStatement } from './BaseStatement'
import { wrap } from '../../../Helpers'

export class Insert extends BaseStatement {

    get columns() {
        const values = this.components.insert || []

        return wrap(Object.keys(values.first() ?? {}))
    }

    get values() {
        return (this.components.insert || []).map(valuesMap => {
            const values = Object.values(valuesMap)
            this.bindings = this.bindings.concat(values)
            return '(' + [...Array(values.length)].map(() => '?').join(', ') + ')'
        }).join(', ')
    }

    toSql() {
        return `INSERT INTO ${this.table} (${this.columns}) VALUES ${this.values} `
    }
}
