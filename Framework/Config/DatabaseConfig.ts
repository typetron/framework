import { BaseConfig } from './BaseConfig'
import { MysqlDriver, SqliteDriver } from '@Typetron/Database'
import { DatabaseDriver } from '@Typetron/Database/Drivers/DatabaseDriver'

export class DatabaseConfig extends BaseConfig<DatabaseConfig> {
    synchronizeSchema = false
    entities: string
    migrationsDirectory = 'Database/migrations'
    seedersDirectory = 'Database/seeders'
    driver: keyof this['drivers'] = process.env.databaseDriver as keyof this['drivers'] ?? 'sqlite'

    drivers: Record<string, () => DatabaseDriver> = {
        sqlite: () => new SqliteDriver(process.env.database ?? 'database.sqlite'),
        mysql: () => new MysqlDriver({
            host: process.env.databaseHost,
            user: process.env.databaseUser,
            password: process.env.databasePassword,
            database: process.env.database,
        }),
    }
}
