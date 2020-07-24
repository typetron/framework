import { Entity } from './Entity';
import { Connection } from './Connection';
import { BelongsToManyField, ColumnField, PrimaryField } from './Fields';
import { EntityMetadata } from './Decorators';
import { wrap } from './Helpers';
import { EntityConstructor } from './index';

export class Schema {

    // tslint:disable-next-line:no-any
    static typesMatches = new Map<any, string>([
        [Entity, 'integer'],
        [PrimaryField, `integer constraint ${String.random(9, 'abcdefghijklmnopqrstuvwxyz')} primary key autoincrement`],
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
        const type = Array.from(this.typesMatches.keys()).find(key =>
            key === columnMetadata.type() || columnType.prototype instanceof key || columnMetadata instanceof key
        ) || String;
        return `${columnMetadata.column} ${this.typesMatches.get(type)}`;
    }

    static async synchronize(connection: Connection, entitiesMetadata: EntityMetadata<Entity>[]) {
        const pivotTables = new Map<string, ColumnField<Entity>[]>();
        for await(const metadata of entitiesMetadata) {
            const table = metadata.table as string;
            const tableInfo = await connection.firstRaw(`SELECT * FROM sqlite_master WHERE name = '${table}'`);
            if (!tableInfo) {
                Object.values(metadata.inverseRelationships).filter(field => field instanceof BelongsToManyField).forEach(field => {
                    const f = field as BelongsToManyField<Entity, Entity>;
                    const entity = Entity as EntityConstructor<Entity>;
                    const pivotTableColumns: ColumnField<Entity>[] = [
                        new ColumnField(entity, 'id', () => Number, 'id'),
                        ...[f.getParentForeignKey(), f.getRelatedForeignKey()].sort().map(columnName => {
                            return new ColumnField(entity, columnName, () => Number, columnName);
                        })
                    ];
                    pivotTables.set(f.getPivotTable(), pivotTableColumns);
                });
                await connection.runRaw(Schema.create(table, Object.values({...metadata.columns, ...metadata.relationships})));
                continue;
            }
            const tableColumns = await connection.getRaw(`PRAGMA table_info(${table})`) as {name: string, type: string}[];
            const columns = Object.values({...metadata.columns, ...metadata.relationships});
            for await (const columnMetadata of columns) {
                const tableColumn = tableColumns.findWhere('name', columnMetadata.column);
                tableColumns.remove(tableColumn);
                if (!tableColumn) {
                    await connection.runRaw(Schema.add(table, columnMetadata));
                }
            }

            if (tableColumns.length) {
                const temporaryTableName = table + '_tmp';
                await connection.runRaw(Schema.create(temporaryTableName, columns));
                const columnList = wrap(columns.pluck('column'));
                await connection.runRaw(`INSERT INTO ${temporaryTableName}(${columnList}) SELECT ${columnList} FROM ${table}`);
                await connection.runRaw(`DROP TABLE ${table}`);
                await connection.runRaw(`ALTER TABLE ${temporaryTableName} RENAME TO ${table};`);
            }
        }

        for await (const [name, columns] of pivotTables) {
            await connection.runRaw(Schema.create(name, columns));
        }

    }
}
