import { Query } from './Query'
import { Expression } from './Expression'

export enum Operators {
    '=' = '=',
    '<' = '<',
    '<=' = '<=',
    '>' = '>',
    '>=' = '>=',
    '!' = '!',
    'AND' = 'AND',
    'OR' = 'OR',
    'IS' = 'IS',
    'IN' = 'IN',
    'NOT IN' = 'NOT IN',
    'LIKE' = 'LIKE',
    'IS NOT' = 'IS NOT',
}

export enum JoinType {
    INNER = 'INNER',
    LEFT = 'LEFT',
    RIGHT = 'RIGHT'
}

export type Boolean = 'AND' | 'OR' | 'XOR';
export type Operator = keyof typeof Operators;
export type SqlValue = string | number | Date | undefined;
export type SqlValueMap = {[key: string]: SqlValue};

class JoinClause {
    type: keyof typeof JoinType;
    table: string;
    first: string;
    operator: Operator;
    second: string;
}

export interface BaseComponents {
    table: string;
}

export interface SelectComponents extends BaseComponents {
    distinct?: boolean;
    columns: (string | Expression)[];
    aggregate?: {
        function: string,
        columns: string[];
    };
    joins: JoinClause[];
    wheres: SqlClause[];
    groups: string[];
    orders: [string, Direction][];
    having: Where[];
    limit?: {from: number, count?: number};
}

export interface InsertComponents extends BaseComponents {
    insert?: SqlValueMap[];
}

export interface UpdateComponents extends BaseComponents {
    update?: SqlValueMap;
}

export interface Components extends BaseComponents, SelectComponents, InsertComponents, UpdateComponents {
}

// export interface SelectComponents extends Components {
//     distinct = false;
//     select: string[] = ['*'];
//     insert?: {};
//     delete?: boolean;
//     joins?: JoinClause[];
//     wheres?: Where[];
//     orderBy?: OrderBy[];
// }

export type WhereFunction = (query: Query) => void;
export type WhereCondition = {[key: string]: string | number};
// export type WhereValue = SqlValue | WhereFunction | WhereCondition;
export type WhereValue = SqlValue;

export type Direction = 'ASC' | 'DESC';

interface SqlClause {
    toSql(): string;

    getValues(): SqlValue[];
}

class SqlExpression implements SqlClause {
    constructor(private sql: string, private values: SqlValue[] = []) {}

    toSql() {
        return this.sql;
    }

    getValues() {
        return this.values;
    }
}

export class WhereExpression extends SqlExpression {
    constructor(public column: string, public expression: SqlExpression, public boolean: Boolean) {
        super(`${boolean} ${column} ${expression.toSql()}`, expression.getValues());
    }
}

export class Where extends WhereExpression {
    constructor(column: string, operator: Operator, value: SqlValue, boolean: Boolean) {
        super(column, new SqlExpression(`${operator} ?`, [value]), boolean);
    }
}

export class WhereNested {
}

export class WhereBetween extends WhereExpression {
    constructor(column: string, values: [SqlValue, SqlValue], boolean: Boolean, not = false) {
        super(column, new SqlExpression(`${not ? 'NOT ' : ''}BETWEEN ? AND ?`, values), boolean);
    }
}

export class WhereLike extends WhereExpression {
    constructor(column: string, value: SqlValue, boolean: Boolean, not = false) {
        super(column, new SqlExpression(`${not ? 'NOT ' : ''}LIKE ?`, [value]), boolean);
    }
}

export class WhereIn extends WhereExpression {
    constructor(column: string, values: WhereValue[], boolean: Boolean, not = false) {
        const value = values.map(() => '?').join(', ');
        super(column, new SqlExpression(`${not ? 'NOT ' : ''}IN (${value})`, values), boolean);
    }
}

export class WhereNull extends WhereExpression {
    constructor(column: string, boolean: Boolean, not = false) {
        super(column, new SqlExpression(`IS ${not ? 'NOT ' : ''}NULL`), boolean);
    }
}

export class WhereSubSelect extends WhereExpression {
    constructor(column: string, operator: Operator, public query: Query, boolean: Boolean) {
        super(column, new SqlExpression(`${operator} (${query.toSql()})`, query.getBindings()), boolean);
    }
}
