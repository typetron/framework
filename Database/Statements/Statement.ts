import { Components, SqlValue } from '../Types';
import { wrap } from '../Helpers';

export const ToSqlInterface = Symbol();

interface ToSql {
    toSql(): string;
}

export abstract class Statement implements ToSql {
    bindings: SqlValue[] = [];

    constructor(public components: Components) {
    }

    get table() {
        return wrap(this.components.table || '');
    }

    get wheres() {
        const wheres = this.components.wheres || [];

        return wheres.map(where => {
            this.bindings = this.bindings.concat(where.getValues());
            return where.toSql();
        }).join(' ').replace(/^(and |or )/i, '');
    }

    get limit() {
        const limit = this.components.limit;
        return limit ?
            `LIMIT ${limit.from}` + limit.count ? `, ${limit.count}` : ''
            : '';
    }

    get joins() {
        return this.components.joins.map(join => {
            return `${join.type} JOIN ${wrap(join.table)} ON ${join.first} ${join.operator} ${join.second}`;
        }).join(' ');
    }

    get groups() {
        return '';
    }

    get havings() {
        return '';
    }

    get orders() {
        if (!this.components.orders?.length) {
            return '';
        }

        return 'ORDER BY ' + this.components.orders.map(order => `${order[0]} ${order[1]}`).join(' ');
    }

    abstract toSql(): string;

    toString() {
        return this.toSql();
    }
}
