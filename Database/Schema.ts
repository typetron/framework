import { Entity } from './Entity';
import { Connection } from './Connection';
import { ColumnField } from './Fields';
import { ID } from './Decorators';

export class Schema {

    // tslint:disable-next-line:no-any
    static typesMatches = new Map<any, string>([
        [Entity, 'integer'],
        [ID, `integer constraint ${String.random(9, 'abcdefghijklmnopqrstuvwxyz')} primary key autoincrement`],
        [Number, 'integer'],
        [String, 'varchar'],
        [Date, 'datetime'],
    ]);

    constructor(connection: Connection) {
    }

    toSql() {
        return 'CREATE TABLE test()';
    }

    static create(table: string, columns: ColumnField<Entity>[]) {
        const columnsSQLs = columns
            .filter(column => column.column)
            .map(columnMetadata => Schema.getColumnSql(columnMetadata));
        return `
            CREATE TABLE ${table} (
                ${columnsSQLs.join(', ')}
            )
        `;
    }

    static add(table: string, column: ColumnField<Entity>) {
        return `ALTER TABLE ${table} ADD ${this.getColumnSql(column)}; `;
    }

    private static getColumnSql(columnMetadata: ColumnField<Entity>): string {
        const columnType = columnMetadata.type();
        const type = Array.from(this.typesMatches.keys()).find((key: object) =>
            key === columnMetadata.type() || columnType.prototype instanceof (key as unknown as Function)
        ) || String;
        return `${columnMetadata.column} ${this.typesMatches.get(type)}`;
    }
}
