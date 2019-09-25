import {
    Boolean,
    Components,
    Direction,
    Operator,
    SqlValue,
    SqlValueMap,
    Where,
    WhereBetween,
    WhereIn,
    WhereLike,
    WhereNull,
    WhereValue
} from './Types';
import { Select } from './Statements/Select';
import { Insert } from './Statements/Insert';
import { Statement } from './Statements/Statement';
import { Delete } from './Statements/Delete';
import { Update } from './Statements/Update';
import { Connection } from './Connection';

export class Query<T = {}> {
    static connection: Connection;
    private statementType: new(c: Components) => Statement = Select;

    private useDistinct = false;

    private components: Components = {
        table: '',
        distinct: false,
        columns: ['*'],
        joins: [],
        wheres: [],
        groups: [],
        orders: [],
        havings: [],
    };
    private bindings: SqlValue[] = [];

    constructor() {
    }

    get statement(): Statement {
        return new this.statementType(this.components);
    }

    static table<T = {[key: string]: SqlValue}>(table: string) {
        return (new this as Query<T>).table(table);
    }

    getBindings() {
        return this.bindings;
    }

    toSql() {
        return this.statement.toSql().replace(/\s{2,}/g, ' ').trim();
    }

    async get<K extends keyof T>(columns?: (K | string)[]): Promise<T[]> {
        return Query.connection.get(this.select(columns || this.components.columns));
    }

    // compileSelect(columns: string[]) {
    //     if (this.aggregate) {
    //         return this.compileAggregate(this.aggregate);
    //     }
    //
    //     const select = this.useDistinct ? 'SELECT DISTINCT ' : 'SELECT ';
    //
    //     return select + columns.join(', ');
    // }

    // compileInsert(data) {
    //     const columns = Object.keys(data).map(value => `'${value}'`);
    //     const values = Object.values(data).map(value => `'${value}'`);
    //     const table = this.components.table;
    //
    //     delete this.components.table;
    //
    //     return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
    // }

    compileAggregate(aggregate: [string, string]) {
        const [aggregateFunction, column] = aggregate;

        const distinct = this.useDistinct ? 'DISTINCT ' : '';

        return `SELECT ${aggregateFunction}(${distinct}${column}) as aggregate`;
    }

    compileTable(table: string) {
        return 'FROM ' + table;
    }

    compileWheres(wheres: Where[]) {
        return wheres.map((where, index) => {
            const boolean = index === 0 ? 'WHERE' : where.boolean;
            return [boolean, where.column, where.operator, '?'].join(' ');
        }).join(' ');
    }

    compileOrderBy(value: [string, string][]) {
        if (!value.length) {
            return;
        }
        return 'ORDER BY ' + value.map(orderBy => orderBy.join(' ')).join(', ');
    }

    // compileJoins(value: [string, string][]) {
    //     return this.components.joins.map((join: Join) => {
    //         return [join.type, 'JOIN', join.table, 'ON', join.first, join.operator, join.second].join(' ');
    //     }).join(' ');
    // }

    table(table: string) {
        this.components.table = table;

        return this;
    }

    async first<K extends keyof T>(columns?: (K | string)[]): Promise<T | undefined> {
        return Query.connection.first(this.select(columns || this.components.columns));
    }

    select<K extends keyof T>(columns: (K | string)[]) {
        this.components.columns = columns as string[];

        return this;
    }

    // where(column: WhereFunction | WhereCondition): this;
    // where(column: string, value: WhereValue): this;
    // where(column: string, operator: Operator, value: WhereValue): this;
    // where(column: WhereFunction): this;
    // where(column: string, operator: WhereValue): this;
    // where(column: string, operator: Operator, value: WhereValue): this;
    where<K extends keyof T>(column: K, operator: Operator | WhereValue | T[K], value?: WhereValue | T[K], boolean: Boolean = 'AND'): this {
        // if (column instanceof Function) {
        //     const query = new WhereNested();
        //     this.components.wheres = query;
        //     column(query);
        //     return this;
        // }
        if (value instanceof Function) {
            // const query = new WhereSubSelect();
            // this.components.wheres = query;
            // column(query);
            return this;
        }

        if (!value) {
            value = operator as string;
            operator = '=';
        }

        // this.bindings.push(value);
        // const where = new Where();
        // where.boolean = this.components.wheres.length ? boolean : 'WHERE';
        // this.components.wheres.push({
        //     column, operator, value, boolean
        // });

        if (typeof value === 'object') {
            return this;
        }

        this.bindings.push(value as SqlValue);
        this.components.wheres.push(new Where(column as string, operator as Operator, value as WhereValue, boolean));

        return this;
    }

    orWhere<K extends keyof T>(column: K, operator: Operator | WhereValue | T[K], value?: WhereValue | T[K]): this {
        return this.where(column, operator, value, 'OR');
    }

    whereIn(column: string, values: SqlValue[], boolean: Boolean = 'AND', not = false): this {
        values.forEach(value => {
            this.bindings.push(value);
        });
        this.components.wheres.push(new WhereIn(column, values, boolean, not));

        return this;
    }

    whereLike(column: string, value: SqlValue, boolean: Boolean = 'AND', not = false): this {
        this.bindings.push(value);
        this.components.wheres.push(new WhereLike(column, value, boolean, not));

        return this;
    }

    whereNotIn(column: string, values: SqlValue[], boolean: Boolean = 'AND'): this {
        this.whereIn(column, values, boolean, true);

        return this;
    }

    orWhereIn(column: string, values: SqlValue[]): this {
        this.whereIn(column, values, 'OR');

        return this;
    }

    orWhereNotIn(column: string, values: SqlValue[]): this {
        this.whereIn(column, values, 'OR', true);

        return this;
    }

    whereBetween(column: string, values: [SqlValue, SqlValue], boolean: Boolean = 'AND', not = false): this {
        this.bindings.push(values[0]);
        this.bindings.push(values[1]);
        this.components.wheres.push(new WhereBetween(column, values, boolean, not));

        return this;
    }

    whereNotBetween(column: string, values: [SqlValue, SqlValue], boolean: Boolean = 'AND'): this {
        this.whereBetween(column, values, boolean, true);

        return this;
    }

    orWhereBetween(column: string, values: [SqlValue, SqlValue]): this {
        this.whereBetween(column, values, 'OR');

        return this;
    }

    orWhereNotBetween(column: string, values: [SqlValue, SqlValue]): this {
        this.whereBetween(column, values, 'OR', true);

        return this;
    }

    whereNull(column: string, boolean: Boolean = 'AND', not = false): this {
        this.components.wheres.push(new WhereNull(column, boolean, not));

        return this;
    }

    whereNotNull(column: string, boolean: Boolean = 'AND'): this {
        this.whereNull(column, boolean, true);

        return this;
    }

    orWhereNull(column: string): this {
        this.whereNull(column, 'OR');

        return this;
    }

    orWhereNotNull(column: string): this {
        this.whereNull(column, 'OR', true);

        return this;
    }

    distinct(value = true) {
        this.components.distinct = value;

        return this;
    }

    orderBy(column: string | [string, Direction][], direction: Direction = 'ASC') {
        if (typeof column === 'string') {
            column = [[column, direction]];
        }
        this.components.orders = column;

        return this;
    }

    count(column = '*') {
        this.components.aggregate = ['COUNT', column];
    }

    max(column = '*') {
        this.components.aggregate = ['MAX', column];
    }

    // join(table: string, first: string, operator?: string, second?: string, type = 'INNER') {
    //     this.components.joins.push({type, table, first, operator, second});
    //
    //     return this;
    // }
    //
    // leftJoin(table: string, first: string, operator: string = null, second: string = null) {
    //     return this.join(table, first, operator, second, 'LEFT');
    // }

    insert(data: SqlValueMap | [SqlValueMap, ...SqlValueMap[]]) {
        this.statementType = Insert;

        if (!Array.isArray(data)) {
            data = [data];
        }

        data.forEach(values => {
            Object.values(values).forEach(value => {
                this.bindings.push(value);
            });
        });

        this.components.insert = data;
    }

    delete(id?: number) {
        this.statementType = Delete;

        if (id) {
            this.where('id' as keyof T, id);
        }
    }

    update(name: string | SqlValueMap, value?: SqlValue) {
        this.statementType = Update;

        let data: SqlValueMap;
        if (typeof name === 'string') {
            data = {[name]: value};
        } else {
            data = name;
        }

        this.bindings = this.bindings.concat(Object.values(data));

        this.components.update = data;
    }
}
