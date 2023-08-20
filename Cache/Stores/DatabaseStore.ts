import { Cache } from '@Typetron/Cache'
import { Query } from '@Typetron/Database'
import { JSONSafeParse } from '@Typetron/Support/utils'
import { CacheItem } from '@Typetron/Cache/types'
import { createHash } from 'crypto'
import { Create } from '@Typetron/Database/Drivers/SQLite/Create'

export class DatabaseStore extends Cache {
    constructor(public table: string) {
        super()
    }

    private get cacheTable() {
        return new Query<CacheItem<unknown>>().table(this.table)
    }

    private getNameHash(name: string) {
        return createHash('sha1').update(name).digest('hex')
    }

    async has(name: string): Promise<boolean> {
        const row = await this.cacheTable.where('name', this.getNameHash(name)).first()
        return !!row
    }

    async get<T>(name: string, defaultValue?: T | (() => T | Promise<T>)): Promise<T | undefined> {
        if (!await Query.connection.driver.tableExists(this.table)) {
            return undefined
        }

        const row = await this.cacheTable.where('name', this.getNameHash(name)).first()

        if (!row) {
            return this.getDefaultValue(defaultValue)
        }

        const currentTime = Date.now()

        if (row.date && row.date < currentTime) {
            await this.delete(name)
            return this.getDefaultValue(defaultValue)
        }

        return JSONSafeParse<T>(String(row.value))
    }

    async remember<T>(name: string, defaultValue?: T | (() => T | Promise<T>), durationInSeconds?: number): Promise<T | undefined> {
        const value = await this.get<T>(name)

        if (!value) {
            const newValue = await this.getDefaultValue(defaultValue)
            await this.set(name, newValue, durationInSeconds)
            return newValue
        }

        return value
    }

    async set(name: string, value: any, durationInSeconds?: number): Promise<void> {
        await this.makeSureTheTableExists()
        const expirationTime = durationInSeconds ? Date.now() + durationInSeconds * 1000 : undefined
        const serializedValue = JSON.stringify(value)

        const existing = await this.cacheTable.where('name', this.getNameHash(name)).first()

        if (existing) {
            await this.cacheTable.where('name', this.getNameHash(name)).update({
                value: serializedValue,
                date: expirationTime
            })
        } else {
            await this.cacheTable.insert({
                name: this.getNameHash(name),
                value: serializedValue,
                date: expirationTime
            })
        }
    }

    async delete(name: string): Promise<void> {
        await this.cacheTable.where('name', this.getNameHash(name)).delete()
    }

    async flush(): Promise<void> {
        await this.cacheTable.delete()
    }

    private async getDefaultValue<T>(defaultValue?: (() => (Promise<T> | T)) | T) {
        const valueFunction = typeof defaultValue === 'function'
            ? defaultValue as () => Promise<T> | T
            : () => defaultValue

        return valueFunction()
    }

    private async makeSureTheTableExists() {
        if (!await Query.connection.driver.tableExists(this.table)) {
            const createStatement = new Create(this.table, [
                {
                    name: 'name',
                    type: 'string',
                    primaryKey: true,
                    nullable: true,
                },
                {
                    name: 'value',
                    type: 'string',
                    nullable: true,
                },
                {
                    name: 'date',
                    type: 'integer',
                    nullable: true,
                },
            ])

            await Query.connection.driver.run(createStatement.toSQL())
        }
    }
}

// import { Cache } from '@Typetron/Cache'
// import { Query } from '@Typetron/Database'
// import { JSONSafeParse } from '@Typetron/Support/utils'
// import { CacheItem } from '@Typetron/Cache/types'
// import { Create } from '@Typetron/Database/Drivers/SQLite/Create'
// import { createHash } from 'node:crypto'
//
// export class DatabaseStore extends Cache {
//
//     has(name: string): Promise<boolean> {
//         throw new Error('Method not implemented.')
//     }
//
//     remember<T>(name: string, defaultValue?: T | (() => T | Promise<T>), duration?: number): Promise<T | undefined> {
//         throw new Error('Method not implemented.')
//     }
//
//     constructor(public table: string) {
//         super()
//     }
//
//     private get cacheTable() {
//         return new Query<CacheItem<unknown>>().table(this.table) // Assuming 'cache' is the table name for cache data
//     }
//
//     async get<T>(name: string, defaultValue?: T | (() => T | Promise<T>)): Promise<T | undefined> {
//         if (!await Query.connection.driver.tableExists(this.table)) {
//             return undefined
//         }
//
//         const row = await this.cacheTable.where('name', this.getNameHash(name)).first()
//
//         if (!row) {
//             return undefined
//         }
//
//         const currentTime = Date.now()
//
//         if (row.date && row.date < currentTime) {
//             await this.delete(name)
//             return undefined
//         }
//
//         return JSONSafeParse<T>(String(row.value))
//     }
//
//     private async makeSureTheTableExists() {
//         if (!await Query.connection.driver.tableExists(this.table)) {
//             const createStatement = new Create(this.table, [
//                 {
//                     name: 'name',
//                     type: 'string',
//                     primaryKey: true,
//                     nullable: true,
//                 },
//                 {
//                     name: 'value',
//                     type: 'string',
//                     nullable: true,
//                 },
//                 {
//                     name: 'date',
//                     type: 'integer',
//                     nullable: true,
//                 },
//             ])
//
//             await Query.connection.driver.run(createStatement.toSQL())
//         }
//     }
//
//     async set(name: string, value: unknown, durationInSeconds?: number): Promise<void> {
//         await this.makeSureTheTableExists()
//         const expirationTime = durationInSeconds ? Date.now() + durationInSeconds * 1000 : undefined
//         const serializedValue = JSON.stringify(value)
//
//         const existing = await this.cacheTable.where('name', this.getNameHash(name)).first()
//
//         if (existing) {
//             await this.cacheTable.where('name', this.getNameHash(name)).update({
//                 value: serializedValue,
//                 date: expirationTime
//             })
//         } else {
//             await this.cacheTable.insert({
//                 name: this.getNameHash(name),
//                 value: serializedValue,
//                 date: expirationTime
//             })
//         }
//     }
//
//     async delete(name: string): Promise<void> {
//         await this.cacheTable.where('name', this.getNameHash(name)).delete()
//     }
//
//     async flush(): Promise<void> {
//         await this.cacheTable.delete()
//     }
//
//     private getNameHash(name: string) {
//         return createHash('sha1').update(name).digest('hex')
//     }
// }
