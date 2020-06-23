import { Provider } from '../Provider';
import { DatabaseConfig } from '../Config';
import { Inject } from '../../Container';
import { Connection, Entity, Query, Schema } from '../../Database';
import { Storage } from '../../Storage';

export class DatabaseProvider extends Provider {

    @Inject()
    databaseConfig: DatabaseConfig;

    @Inject()
    storage: Storage;

    async register() {
        if (this.databaseConfig.database) {
            Query.connection = new Connection(this.databaseConfig.database);
            if (this.databaseConfig.synchronizeSchema) {
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

        await Schema.synchronize(connection, entitiesMetadata);
    }

}
