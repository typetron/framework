import { Provider } from '../Provider'
import { DatabaseConfig } from '../Config'
import { Inject } from '../../Container'
import { Connection, Entity, Query } from '../../Database'
import { Storage } from '../../Storage'

export class DatabaseProvider extends Provider {

    @Inject()
    databaseConfig: DatabaseConfig

    @Inject()
    storage: Storage

    async register() {
        Query.connection = new Connection(this.databaseConfig.driver)
        if (this.databaseConfig.synchronizeSchema) {
            await this.synchronize(Query.connection)
        }
    }

    private async synchronize(connection: Connection) {
        const entityFiles = await this.storage.files(this.databaseConfig.entities, true)
        const entitiesImports: (typeof Entity)[] = await Promise.all(
            entityFiles.map(file => import(file.path))
        )
        const entitiesMetadata = entitiesImports.flatMap(item => Object.values(item).pluck('metadata'))

        await connection.driver.schema.synchronize(entitiesMetadata)
    }

}
