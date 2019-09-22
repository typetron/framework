import { Statement } from './Statement';
import { wrap } from '../Helpers';

export class Insert extends Statement {

    get columns() {
        const values = this.components.insert || [];

        return wrap(Object.keys(values.first()));
    }

    get values() {
        return (this.components.insert || []).map(values => {
            const parameters = Object.values(values);
            return '(' + [...Array(parameters.length)].map(() => '?').join(', ') + ')';
        }).join(', ');
    }

    toSql() {
        return `INSERT INTO ${this.table} (${this.columns}) VALUES ${this.values} `;
    }
}
