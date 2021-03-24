import { BaseConfig } from './BaseConfig'
import { DatabaseDriver } from '@Typetron/Database/Drivers/DatabaseDriver'
import { SqliteDriver } from '@Typetron/Database/Drivers'

export class DatabaseConfig extends BaseConfig<DatabaseConfig> {
    synchronizeSchema = false
    entities: string
    migrationsDirectory = 'migrations'
    driver: DatabaseDriver = new SqliteDriver('database.sqlite')
}
