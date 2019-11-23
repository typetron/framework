import {
    Boolean,
    Components,
    Direction,
    JoinType,
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
        having: [],
    };

    get statement(): Statement {
        return new this.statementType(this.components);
    }

    static table<T = {[key: string]: SqlValue}>(table: string) {
        return (new this as Query<T>).table(table);
    }

    static async lastInsertedId(): Promise<number | string> {
        return await Query.connection.lastInsertedId();
    }

    getBindings() {
        const statement = this.statement;
        statement.toSql();
        return statement.bindings;
    }

    async get<K extends keyof T>(columns?: (K | string)[]): Promise<T[]> {
        return Query.connection.get(this.select(columns || this.components.columns));
    }

    toSql() {
        const statement = this.statement;
        const sql = statement.toSql();
        return sql.replace(/\s{2,}/g, ' ').trim();
    }

    async first<K extends keyof T>(columns?: (K | string)[]): Promise<T | undefined> {
        return Query.connection.first(this.select(columns || this.components.columns));
    }

    async run<K extends keyof T>(): Promise<void> {
        await Query.connection.run(this);
    }

    compileAggregate(aggregate: [string, string]) {
        const [aggregateFunction, column] = aggregate;

        const distinct = this.useDistinct ? 'DISTINCT ' : '';

        return `SELECT ${aggregateFunction}(${distinct}${column}) as aggregate`;
    }

    table(table: string) {
        this.components.table = table;

        return this;
    }

    select<K extends keyof T>(columns: (K | string)[]) {
        this.components.columns = columns as string[];

        return this;
    }

    addSelect<K extends keyof T>(columns: (K | string)[]) {
        this.components.columns.push(...columns as string[]);

        return this;
    }

    where<K extends keyof T>(column: K | string, operator: Operator | WhereValue | T[K], value?: WhereValue | T[K], boolean: Boolean = 'AND'): this {
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

        this.components.wheres.push(new Where(column as string, operator as Operator, value as WhereValue, boolean));

        return this;
    }

    orWhere<K extends keyof T>(column: K | string, operator: Operator | WhereValue | T[K], value?: WhereValue | T[K]): this {
        return this.where(column, operator, value, 'OR');
    }

    andWhere<K extends keyof T>(column: K | string, operator: Operator | WhereValue | T[K], value?: WhereValue | T[K]): this {
        return this.where(column, operator, value);
    }

    whereIn<K extends keyof T>(column: K | string, values: WhereValue[] | T[K][], boolean: Boolean = 'AND', not = false): this {
        this.components.wheres.push(new WhereIn(column as string, values as WhereValue[], boolean, not));

        return this;
    }

    andWhereIn<K extends keyof T>(column: K | string, values: SqlValue[]): this {
        return this.whereIn(column, values);
    }

    whereLike<K extends keyof T>(column: K | string, value: SqlValue, boolean: Boolean = 'AND', not = false): this {
        this.components.wheres.push(new WhereLike(column as string, value, boolean, not));

        return this;
    }

    whereNotIn<K extends keyof T>(column: K | string, values: SqlValue[], boolean: Boolean = 'AND'): this {
        return this.whereIn(column, values, boolean, true);
    }

    orWhereIn<K extends keyof T>(column: K | string, values: SqlValue[]): this {
        return this.whereIn(column, values, 'OR');
    }

    orWhereNotIn<K extends keyof T>(column: K | string, values: SqlValue[]): this {
        return this.whereIn(column, values, 'OR', true);
    }

    whereBetween(column: string, values: [SqlValue, SqlValue], boolean: Boolean = 'AND', not = false): this {
        this.components.wheres.push(new WhereBetween(column, values, boolean, not));

        return this;
    }

    whereNotBetween(column: string, values: [SqlValue, SqlValue], boolean: Boolean = 'AND'): this {
        return this.whereBetween(column, values, boolean, true);
    }

    orWhereBetween(column: string, values: [SqlValue, SqlValue]): this {
        return this.whereBetween(column, values, 'OR');
    }

    orWhereNotBetween(column: string, values: [SqlValue, SqlValue]): this {
        return this.whereBetween(column, values, 'OR', true);
    }

    whereNull(column: string, boolean: Boolean = 'AND', not = false): this {
        this.components.wheres.push(new WhereNull(column, boolean, not));

        return this;
    }

    whereNotNull(column: string, boolean: Boolean = 'AND'): this {
        return this.whereNull(column, boolean, true);
    }

    orWhereNull(column: string): this {
        return this.whereNull(column, 'OR');
    }

    orWhereNotNull(column: string): this {
        return this.whereNull(column, 'OR', true);
    }

    distinct(value = true) {
        this.components.distinct = value;

        return this;
    }

    join(table: string, first: string, operator: Operator, second: string, type: keyof typeof JoinType = JoinType.INNER) {
        this.components.joins.push({type, table, first, operator, second});

        return this;
    }

    innerJoin(table: string, first: string, operator: Operator, second: string) {
        return this.join(table, first, operator, second, JoinType.INNER);
    }

    leftJoin(table: string, first: string, operator: Operator, second: string) {
        return this.join(table, first, operator, second, JoinType.LEFT);
    }

    rightJoin(table: string, first: string, operator: Operator, second: string) {
        return this.join(table, first, operator, second, JoinType.RIGHT);
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

    async insert(data: SqlValueMap | SqlValueMap[]) {
        this.statementType = Insert;

        if (!Array.isArray(data)) {
            data = [data];
        }

        this.components.insert = data;

        await this.run();
    }

    async delete() {
        this.statementType = Delete;

        await this.run();
    }

    async update(name: string | SqlValueMap, value?: SqlValue) {
        this.statementType = Update;

        let data: SqlValueMap;
        if (typeof name === 'string') {
            data = {[name]: value};
        } else {
            data = name;
        }

        this.components.update = data;

        await this.run();
    }
}
