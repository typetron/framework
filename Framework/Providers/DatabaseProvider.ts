import { Provider } from '../Provider';
import { DatabaseConfig } from '../Config';
import { Inject } from '../../Container';
import { Connection, Entity, Query, Schema } from '../../Database';
import { Storage } from '../../Storage';
import { wrap } from '../../Database/Helpers';
import { ManyToManyField, OneToManyField } from '../../Database/Fields';

export class DatabaseProvider extends Provider {

    @Inject()
    databaseConfig: DatabaseConfig;

    @Inject()
    storage: Storage;

    async register() {
        if (this.databaseConfig.database) {
            Query.connection = new Connection(this.databaseConfig.database);
            if (this.databaseConfig.synchronizeSchema) {
                // Schema.synchronize(Query.connection, await this.getEntities(Query.connection));
                await this.getEntities(Query.connection);
            }
        }
    }

    private async getEntities(connection: Connection) {
        const entityFiles = await this.storage.files(this.databaseConfig.entities, true);
        const entitiesImports: Record<string, typeof Entity>[] = await Promise.all(
            entityFiles.map(file => import(file.path))
        );
        const entitiesMetadata = entitiesImports.flatMap(item => Object.values(item).pluck('metadata'));

        for await(const metadata of entitiesMetadata) {
            const table = await connection.firstRaw(`SELECT * FROM sqlite_master WHERE name = '${metadata.table}'`);
            if (!metadata.table) {
                console.error('entity table name is not set for ->', metadata);
                continue;
            }
            if (!table) {
                await connection.runRaw(Schema.create(metadata.table, Object.values(metadata.columns)));
                continue;
            }
            const tableColumns = await connection.getRaw(`PRAGMA table_info(${metadata.table})`) as {name: string, type: string}[];
            const columns = Object.values(metadata.columns).filter(column =>
                !(column instanceof OneToManyField) && !(column instanceof ManyToManyField)
            );
            for await (const columnMetadata of columns) {
                const tableColumn = tableColumns.findWhere('name', columnMetadata.column);
                tableColumns.remove(tableColumn);
                if (!tableColumn) {
                    await connection.runRaw(Schema.add(metadata.table, columnMetadata));
                }
            }

            if (tableColumns.length) {
                const temporaryTableName = metadata.table + '_tmp';
                await connection.runRaw(Schema.create(temporaryTableName, columns));
                const columnList = wrap(columns.pluck('column'));
                await connection.runRaw(`INSERT INTO ${temporaryTableName}(${columnList}) SELECT ${columnList} FROM ${metadata.table}`);
                await connection.runRaw(`DROP TABLE ${metadata.table}`);
                await connection.runRaw(`ALTER TABLE ${temporaryTableName} RENAME TO ${metadata.table};`);
            }
        }
    }

}
