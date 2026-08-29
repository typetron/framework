import { Provider } from '../Provider'
import { DatabaseConfig } from '../Config'
import { Inject } from '../../Container'
import { Connection, Entity, Query } from '@Typetron/Database'
import { Filesystem } from '../../Storage'

export class DatabaseProvider extends Provider {

    @Inject()
    databaseConfig: DatabaseConfig

    @Inject()
    storage: Filesystem

    async register() {
        const driver = this.databaseConfig.drivers[this.databaseConfig.driver]
        if (!driver) {
            throw new Error(`Driver '${this.databaseConfig.driver}' is not defined in the 'database.drivers' config`)
        }
        Query.connection = new Connection(driver())
        if (this.databaseConfig.synchronizeSchema) {
            await this.synchronize(Query.connection)
        }
    }

    private async synchronize(connection: Connection) {
        const entityFiles = await this.storage.files(this.databaseConfig.entities, true)
        const entitiesImports: (typeof Entity)[] = await Promise.all(
            entityFiles.map(file => import(file.path))
        )
        const entitiesMetadata = entitiesImports.flatMap(item => Object.values(item).pluck('metadata')).filter(Boolean)

        await connection.driver.schema.synchronize(entitiesMetadata)
    }

}
