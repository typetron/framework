import { Query } from './Query';
import { wrap } from './Helpers';

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

export type Operator = keyof typeof Operators;
export type JoinType = 'LEFT' | 'RIGHT' | 'INNER' | 'CROSS';
export type Boolean = 'AND' | 'OR' | 'XOR';

export type SqlValue = string | number | Date | undefined;
export type SqlValueMap = {[key: string]: SqlValue};

class Join {
    type: JoinType;
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
    joins: Join[];
    wheres: WhereClause[];
    groups?: string[];
    orders?: [string, Direction][];
    havings?: Where[];
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
//     joins?: Join[];
//     wheres?: Where[];
//     orderBy?: OrderBy[];
// }

export type WhereFunction = (query: Query) => void;
export type WhereCondition = {[key: string]: string | number};
export type WhereValue = SqlValue | WhereFunction | WhereCondition;

export class WhereBasic {
}

export class WhereSubSelect {
}

export class WhereNested {
}

interface WhereClause {
    toSql(): string;
}

export class Where implements WhereClause {
    constructor(public column: string, public operator: Operator, public value: WhereValue, public boolean: Boolean) {
    }

    toSql() {
        return `${this.boolean} ${wrap(this.column as string)} ${this.operator} ?`;
    }
}

export class WhereBetween implements WhereClause {
    constructor(public column: string, public values: [SqlValue, SqlValue], public boolean: Boolean, public not = false) {
    }

    toSql() {
        return `${this.boolean} ${wrap(this.column)} ${this.not ? 'NOT ' : ''}BETWEEN ? AND ?`;
    }
}

export class WhereIn implements WhereClause {
    constructor(public column: string, public values: SqlValue[], public boolean: Boolean, public not = false) {
    }

    toSql() {
        const values = this.values.map(() => '?').join(', ');
        return `${this.boolean} ${wrap(this.column)} ${this.not ? 'NOT ' : ''}IN (${values})`;
    }
}

export class WhereNull implements WhereClause {
    constructor(public column: string, public boolean: Boolean, public not = false) {
    }

    toSql() {
        return `${this.boolean} ${wrap(this.column)} IS ${this.not ? 'NOT ' : ''}NULL`;
    }
}

export type Direction = 'ASC' | 'DESC';
