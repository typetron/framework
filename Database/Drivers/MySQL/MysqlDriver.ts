import { DatabaseDriver } from '@Typetron/Database/Drivers/DatabaseDriver'
import { Connection, ConnectionConfig, createConnection, OkPacket } from 'mysql'
import { SqlValue } from '@Typetron/Database/Types'
import { Create } from '../SQL/Statements/Create'
import { Select } from '../SQL/Statements/Select'
import { Insert } from '../SQL/Statements/Insert'
import { Delete } from '../SQL/Statements/Delete'
import { Update } from '../SQL/Statements/Update'
import { Alter } from '../SQL/Statements/Alter'
import { SchemaContract } from '../SchemaContract'
import { Schema } from './Schema'

export class MysqlDriver extends DatabaseDriver {
    connection: Connection

    schema: SchemaContract = new Schema(this)

    statements = {
        create: Create,
        select: Select,
        insert: Insert,
        delete: Delete,
        update: Update,
        alter: Alter,
    }

    constructor(connectionConfig: ConnectionConfig) {
        super()
        this.connection = createConnection({
            connectTimeout: 30000,
            ...connectionConfig,
        })

        this.connection.connect()
    }

    async truncate(table: string) {
        await this.run(`TRUNCATE TABLE ${table}`)
    }

    runRaw<T>(query: string, params: SqlValue[] = []): Promise<T | OkPacket> {
        return new Promise((resolve, reject) => {
            this.connection.query(query, params, (error, results, fields) => {
                if (error) {
                    error.message += `in SQL: "${error.sql}"`
                    return reject(error)
                }
                resolve(results)
            })
        })
    }

    async run(query: string, params: SqlValue[] = []) {
        await this.runRaw(query, params)
    }

    async get<T>(query: string, params: SqlValue[] = []): Promise<T[]> {
        return (await this.runRaw(query, params) as T[])
    }

    async first<T>(query: string, params: SqlValue[] = []): Promise<T> {
        return (await this.runRaw(query, params) as T[])?.[0]
    }

    async insertOne(query: string, params: SqlValue[] = []): Promise<number> {
        return (await this.runRaw(query, params) as OkPacket).insertId
    }

    tables() {
        return this.get<{name: string}>(
            `select TABLE_NAME as name
             from information_schema.TABLES
             WHERE table_schema = ?
            `,
            [this.connection.config.database]
        )
    }

    tableExists(table: string): Promise<Boolean> {
        return this.first(
            `select *
             from information_schema.tables
             where table_name = ?
               and table_schema = ?
            `,
            [table, this.connection.config.database]
        )
    }

    tableColumns(table: string) {
        return this.get<{name: string, type: string}>(
            `select COLUMN_NAME as name,
                    DATA_TYPE   as type
             from information_schema.COLUMNS
             where table_name = ?
               and table_schema = ?
            `,
            [table, this.connection.config.database]
        )
    }
}
