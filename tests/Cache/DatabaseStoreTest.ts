import { suite, test } from '@testdeck/mocha'
import { CacheItem, DatabaseStore } from '@Typetron/Cache'
import { expect } from 'chai'
import { createHash } from 'crypto'
import { Connection, Query, SqliteDriver } from '@Typetron/Database'
import { Storage } from '@Typetron/Storage'

const tableName = 'cache'
const databaseFilePath = './tests/Cache/database.sqlite'

@suite
class DatabaseStoreTest {

    databaseStore = new DatabaseStore(tableName)

    static async before() {
        Query.connection = new Connection(new SqliteDriver(databaseFilePath))
    }

    static async after() {
        await new Storage().deleteDirectory(databaseFilePath)
    }

    private getCacheRecord(name: string) {
        const cacheKeyHash = createHash('sha1').update(name).digest('hex')
        return Query.table<CacheItem<unknown>>(tableName).where('name', cacheKeyHash).first()
    }

    @test
    async returnsUndefinedIfRecordDoesntExist() {
        const value = await this.databaseStore.get('tests')
        expect(value).to.be.undefined
    }

    @test
    async testPutCreatesRecord() {
        const contents = 'test'

        await this.databaseStore.set('foo', contents)

        const cacheRecord = await this.getCacheRecord('foo')
        expect(cacheRecord).to.exist
        expect((cacheRecord as CacheItem<any>).value).to.be.equal(JSON.stringify(contents))
    }

    @test
    async testExpirationValueIsWrittenInCacheRecord() {
        const durationInSeconds = 60
        const expirationTime = Date.now() + durationInSeconds * 1000

        await this.databaseStore.set('expireTest', 'value', durationInSeconds)
        const cacheRecord = await this.getCacheRecord('expireTest')

        expect(cacheRecord).to.exist
        expect(new Date((cacheRecord as CacheItem<unknown>).date ?? Infinity).getTime()).to.be.closeTo(expirationTime, 1000) // Allowing a 1-second difference
    }

    @test
    async testCacheValueIsUndefinedIfExpired() {
        const durationInSeconds = -60 // Setting a past expiration

        await this.databaseStore.set('anotherExpiredTest', 'value', durationInSeconds)

        const value = await this.databaseStore.get('anotherExpiredTest')
        expect(value).to.be.undefined

        const cacheRecord = await this.getCacheRecord('anotherExpiredTest')
        expect(cacheRecord).to.be.undefined
    }

    @test
    async testDeleteMethodDeletesRecordFromDatabase() {
        await this.databaseStore.set('deleteTest', 'value')

        await this.databaseStore.delete('deleteTest')

        const cacheRecord = await this.getCacheRecord('deleteTest')
        expect(cacheRecord).to.be.undefined
    }

    @test
    async testFlushMethodDeletesAllRecords() {
        await this.databaseStore.set('flushTest', 'value')

        await this.databaseStore.flush()

        const allRecords = await Query.table(tableName).get()
        expect(allRecords.length).to.be.equal(0)
    }

    @test
    async testRememberMethodCreatesRecordIfNotExists() {
        const value = await this.databaseStore.remember('rememberTest', 'defaultValue', 60)

        expect(value).to.equal('defaultValue')

        const cacheRecord = await this.getCacheRecord('rememberTest')
        expect(cacheRecord).to.exist
        expect((cacheRecord as CacheItem<any>).value).to.be.equal(JSON.stringify('defaultValue'))
    }

    @test
    async testRememberMethodReturnsExistingValue() {
        await this.databaseStore.set('rememberTest2', 'existingValue')

        const value = await this.databaseStore.remember('rememberTest2', 'defaultValue', 60)

        expect(value).to.equal('existingValue')
    }
}

// import { suite, test } from '@testdeck/mocha'
// import { CacheItem, DatabaseStore } from '@Typetron/Cache'
// import { expect } from 'chai'
// import { createHash } from 'node:crypto'
// import { Connection, Query, SqliteDriver } from '@Typetron/Database'
// import { Storage } from '@Typetron/Storage'
//
// const tableName = 'cache'
// const databaseFilePath = './tests/Cache/database.sqlite'
//
// @suite
// class DatabaseStoreTest {
//
//     databaseStore = new DatabaseStore(tableName)
//
//     static async before() {
//         Query.connection = new Connection(new SqliteDriver(databaseFilePath))
//     }
//
//     static async after() {
//         await new Storage().deleteDirectory(databaseFilePath)
//     }
//
//     private getCacheRecord(name: string) {
//         const cacheKeyHash = createHash('sha1').update(name).digest('hex')
//         return Query.table<CacheItem<unknown>>(tableName).where('name', cacheKeyHash).first()
//     }
//
//     @test
//     async returnsUndefinedIfRecordDoesntExist() {
//         const value = await this.databaseStore.get('tests')
//         expect(value).to.be.undefined
//     }
//
//     @test
//     async testPutCreatesRecord() {
//         const contents = 'test'
//
//         await this.databaseStore.set('foo', contents)
//
//         const cacheRecord = await this.getCacheRecord('foo')
//         expect(cacheRecord).to.exist
//         expect((cacheRecord as CacheItem<any>).value).to.be.equal(JSON.stringify(contents))
//     }
//
//     @test
//     async testExpirationValueIsWrittenInCacheRecord() {
//         const durationInSeconds = 60
//         const expirationTime = Date.now() + durationInSeconds * 1000
//
//         await this.databaseStore.set('expireTest', 'value', durationInSeconds)
//         const cacheRecord = await this.getCacheRecord('expireTest')
//
//         expect(cacheRecord).to.exist
//         expect(new Date((cacheRecord as CacheItem<unknown>).date ?? Infinity).getTime()).to.be.closeTo(expirationTime, 1000) // Allowing a 1-second difference
//     }
//
//     @test
//     async testCacheValueIsUndefinedIfExpired() {
//         const durationInSeconds = -60 // Setting a past expiration
//
//         await this.databaseStore.set('anotherExpiredTest', 'value', durationInSeconds)
//
//         const value = await this.databaseStore.get('anotherExpiredTest')
//         expect(value).to.be.undefined
//
//         const cacheRecord = await this.getCacheRecord('anotherExpiredTest')
//         expect(cacheRecord).to.be.undefined
//     }
//
//     @test
//     async testDeleteMethodDeletesRecordFromDatabase() {
//         await this.databaseStore.set('deleteTest', 'value')
//
//         await this.databaseStore.delete('deleteTest')
//
//         const cacheRecord = await this.getCacheRecord('deleteTest')
//         expect(cacheRecord).to.be.undefined
//     }
//
//     @test
//     async testFlushMethodDeletesAllRecords() {
//         await this.databaseStore.set('flushTest', 'value')
//
//         await this.databaseStore.flush()
//
//         const allRecords = await Query.table(tableName).get()
//         expect(allRecords.length).to.be.equal(0)
//     }
// }
