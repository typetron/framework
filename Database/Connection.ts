import { Query } from './Query'
import { DatabaseDriver } from './Drivers/DatabaseDriver'
import { SqlValue } from './Types'

export class Connection {

    constructor(public driver: DatabaseDriver) {}

    async run(query: Query): Promise<void> {
        return this.driver.run(query.toSQL(), query.getBindings())
    }

    async insertOne(query: Query): Promise<number> {
        return this.driver.insertOne(query.toSQL(), query.getBindings())
    }

    truncate(table: string) {
        return this.driver.truncate(table)
    }

    async get<T>(query: Query<T>): Promise<T[]> {
        return await this.driver.get<T>(query.toSQL(), query.getBindings()) as T[]
    }

    async first<T>(query: Query<T>): Promise<T | undefined> {
        return await this.driver.first(query.toSQL(), query.getBindings()) as T
    }

    async getRaw<T>(rawQuery: string, params: SqlValue[] = []): Promise<T[]> {
        return await this.driver.get(rawQuery, params) as T[]
    }

    async firstRaw<T>(rawQuery: string, params: SqlValue[] = []): Promise<T> {
        return await this.driver.first(rawQuery, params) as T
    }

    async runRaw(rawQuery: string, params: SqlValue[] = []): Promise<void> {
        return this.driver.run(rawQuery, params)
    }

    async tables() {
        return this.driver.tables()
    }

    async tableExists(table: string) {
        return this.driver.tableExists(table)
    }

    async tableColumns(table: string) {
        return this.driver.tableColumns(table)
    }
}
