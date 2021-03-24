import { Database } from 'sqlite3'
import { SqlValue } from '@Typetron/Database/Types'
import { DatabaseDriver } from '../DatabaseDriver'
import { Create } from '../SQL/Statements/Create'
import { Select } from '../SQL/Statements/Select'
import { Insert } from '../SQL/Statements/Insert'
import { Delete } from '../SQL/Statements/Delete'
import { Update } from '../SQL/Statements/Update'
import { Alter } from '../SQL/Statements/Alter'
import { Schema } from './Schema'
import { SchemaContract } from '@Typetron/Database/Drivers/SchemaContract'

export class SqliteDriver implements DatabaseDriver {
    database: Database

    schema: SchemaContract = new Schema(this)

    statements = {
        create: Create,
        select: Select,
        insert: Insert,
        delete: Delete,
        update: Update,
        alter: Alter,
    }

    constructor(databaseFilePath: string) {
        this.database = new Database(databaseFilePath)
    }

    async run(query: string, params: SqlValue[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            const stack = Error('SQLite').stack
            this.database.run(query, params, error => {
                if (error) {
                    const e = new Error(`${error} in '${query}' `)
                    e.stack = stack
                    return reject(e)
                }

                resolve()
            })
        })
    }

    async insertOne(query: string, params: SqlValue[] = []): Promise<number> {
        await this.run(query, params)
        return this.lastInsertedId()
    }

    async truncate(table: string) {
        return this.run(`DELETE FROM ${table}`)
    }

    async lastInsertedId(): Promise<number> {
        return new Promise<number>(((resolve, reject) => {
            const stack = Error('SQLite').stack
            this.database.get('SELECT last_insert_rowid() as id;', [], (error, lastInsert) => {
                if (error) {
                    const e = new Error(`${error} when trying to get the last inserted id`)
                    e.stack = stack
                    return reject(e)
                }
                resolve(lastInsert.id)
            })
        }))
    }

    async get<T>(query: string, params: SqlValue[] = []): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            const stack = Error('SQLite').stack
            this.database.all(query, params, (error, rows) => {
                if (error) {
                    const e = new Error(`${error} in '${query}' `)
                    e.stack = stack
                    return reject(e)
                }
                resolve(rows)
            })
        })
    }

    async first<T>(query: string, params: SqlValue[] = []): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const stack = Error('SQLite').stack
            this.database.get(query, params, (error, row) => {
                if (error) {
                    const e = new Error(`${error} in '${query}' `)
                    e.stack = stack
                    return reject(e)
                }
                resolve(row)
            })
        })
    }

    tables() {
        return this.get<{name: string}>(
            `SELECT name
             FROM sqlite_master
             WHERE type = 'table'`
        )
    }

    tableExists(table: string): Promise<Boolean> {
        return this.first(
            `SELECT *
             FROM sqlite_master
             WHERE name = ?`,
            [table]
        )
    }

    tableColumns(table: string) {
        return this.get<{name: string, type: string}>(`PRAGMA table_info(${table})`)
    }
}
