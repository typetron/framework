import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { File, Storage } from '../../../Storage'
import { Connection, Query, SqliteDriver } from '../../../Database'
import { MigrationHistory, Migrator } from '../../../Database/Migrations'
import { anything, instance, mock, when } from 'ts-mockito'

@suite
class RunnerTest {
    private runner: Migrator
    private migrationsPath = './test/Database/Migrations/migrations'
    private migrationFiles = ['1.createUserTable.ts', '2.createArticlesTable.ts']
    private tableNames = ['migration_test_users', 'migration_test_articles']

    async before() {
        Query.connection = new Connection(new SqliteDriver(':memory:'))
        // Query.connection = new Connection(new MysqlDriver({
        //     host: 'localhost', user: 'root', password: 'root', database: 'typetron_test'
        // }))
        this.runner = new Migrator(new Storage(), Query.connection, this.migrationsPath)
    }

    async after() {
        if (await Query.connection.tableExists(MigrationHistory.getTable())) {
            await this.runner.reset()
            await Query.connection.runRaw(`DROP TABLE IF EXISTS ${MigrationHistory.getTable()}`)
        }
    }

    @test
    async getFilesByPath() {
        const migrationFiles = await this.runner.files()

        expect(migrationFiles).to.have.length(2)
    }

    @test
    async shouldMigrate() {
        const migrated = await this.runner.migrate()

        expect(migrated).equals(true)

        const tables = await Query.connection.tables()

        expect(tables.pluck('name')).to.include.members(this.tableNames)
    }

    @test
    async shouldRollbackOnce() {
        await this.migrateInBatches()

        const rollback = await this.runner.rollback()

        expect(rollback).equals(true)

        const tables = await Query.connection.tables()

        expect(tables.pluck('name')).to.include(this.tableNames[0])
        expect(tables.pluck('name')).to.not.include(this.tableNames[1])
    }

    @test
    async shouldRollbackBySteps() {
        await this.migrateInBatches()
        const rollback = await this.runner.rollback(2)

        expect(rollback).equals(true)

        const tables = await Query.connection.tables()

        expect(tables.pluck('name')).to.not.include.members(this.tableNames)
    }

    @test
    async shouldReset() {
        await this.migrateInBatches()
        const rollback = await this.runner.reset()

        expect(rollback).equals(true)

        const tables = await Query.connection.tables()

        expect(tables.pluck('name')).to.not.include.members(this.tableNames)
    }

    private async migrateInBatches() {
        const mockStorage = mock(Storage)
        when(mockStorage.files(anything(), anything()))
            .thenReturn([new File(this.migrationFiles[0], this.migrationsPath)])
            .thenReturn([new File(this.migrationFiles[1], this.migrationsPath)])

        this.runner.storage = instance(mockStorage)
        await this.runner.migrate()
        await this.runner.migrate()
    }
}
