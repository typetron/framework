import { Query } from './Query';

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
    columns: string[];
    aggregate?: [string, string | string[]];
    joins: JoinClause[];
    wheres: SqlClause[];
    groups?: string[];
    orders?: [string, Direction][];
    having?: Where[];
    limit?: {from: number, count: number};
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

export class WhereBasic {
}

export class WhereSubSelect {
}

export class WhereNested {
}

interface SqlClause {
    toSql(): string;

    getValues(): SqlValue[];
}

export class Where implements SqlClause {
    constructor(public column: string, public operator: Operator, public value: SqlValue, public boolean: Boolean) {
    }

    toSql() {
        return `${this.boolean} ${this.column} ${this.operator} ?`;
    }

    getValues() {
        return [this.value];
    }
}

export class WhereBetween implements SqlClause {
    constructor(public column: string, public values: [SqlValue, SqlValue], public boolean: Boolean, public not = false) {
    }

    toSql() {
        return `${this.boolean} ${this.column} ${this.not ? 'NOT ' : ''}BETWEEN ? AND ?`;
    }

    getValues() {
        return this.values;
    }
}

export class WhereLike implements SqlClause {
    constructor(public column: string, public value: SqlValue, public boolean: Boolean, public not = false) {
    }

    toSql() {
        return `${this.boolean} ${this.column} ${this.not ? 'NOT ' : ''}LIKE ?`;
    }

    getValues() {
        return [this.value];
    }
}

export class WhereIn implements SqlClause {
    constructor(public column: string, public values: SqlValue[], public boolean: Boolean, public not = false) {
    }

    toSql() {
        const values = this.values.map(() => '?').join(', ');
        return `${this.boolean} ${this.column} ${this.not ? 'NOT ' : ''}IN (${values})`;
    }

    getValues() {
        return this.values;
    }
}

export class WhereNull implements SqlClause {
    constructor(public column: string, public boolean: Boolean, public not = false) {
    }

    toSql() {
        return `${this.boolean} ${this.column} IS ${this.not ? 'NOT ' : ''}NULL`;
    }

    getValues() {
        return [];
    }
}

export type Direction = 'ASC' | 'DESC';
