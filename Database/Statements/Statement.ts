import { Components } from '../Types';
import { wrap } from '../Helpers';

export const ToSqlInterface = Symbol();

interface ToSql {
    toSql(): string;
}

export abstract class Statement implements ToSql {
    constructor(public components: Components) {
    }

    get table() {
        return wrap(this.components.table || '');
    }

    get wheres() {
        const wheres = this.components.wheres || [];

        return wheres.map(where => where.toSql()).join(' ').replace(/^(and |or )/i, '');
    }

    get limit() {
        const limit = this.components.limit;
        return limit ?
            `LIMIT ${limit.from}` + limit.count ? `, ${limit.count}` : ''
            : '';
    }

    get joins() {
        return '';
    }

    get groups() {
        return '';
    }

    get havings() {
        return '';
    }

    get orders() {
        return '';
    }

    abstract toSql(): string;

    toString() {
        return this.toSql();
    }
}
