import { Statement } from './Statement';
import { wrap } from '../Helpers';

export class Update extends Statement {

    get wheres() {
        if (!this.components.wheres.length) {
            return '';
        }

        return 'WHERE ' + super.wheres;
    }

    get columns() {
        const columns = [];
        const values = this.components.update || {};
        for (const column in values) {
            columns.push(`${wrap(column)} = ?`);
        }
        return columns.join(', ');
    }

    toSql() {
        return `
            UPDATE
            ${this.table}
            SET ${this.columns}
            ${this.wheres}
            ${this.orders}
            ${this.limit}
        `;
    }
}
