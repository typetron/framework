import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { Storage } from '../../../Storage'
import { Connection, Query } from '../../../Database'
import { Migrator } from '../../../Database/Migrations'

@suite
class RunnerTest {
    protected runner: Migrator

    protected migrationsPath = './test/Migrations/migrations'
    private tableName = 'migrationTestUsers'

    async before() {
        this.runner = new Migrator(new Storage(), Query.connection = new Connection(':memory:'), this.migrationsPath)
    }

    @test
    async getFilesByPath() {
        const migrationFiles = await this.runner.files()

        expect(migrationFiles).to.have.length(1)
    }

    @test
    async shouldMigrate() {
        const migrated = await this.runner.migrate({
            fresh: true
        })

        expect(migrated).equals(true)

        const hasTable = await Query.connection
            .firstRaw(`SELECT name
                       FROM sqlite_master
                       WHERE type = 'table'
                         AND name = '${this.tableName}';`) as {name: string}

        expect(hasTable).not.equal(undefined)
        expect(hasTable.name).equal(this.tableName)
    }

    @test
    async shouldRollback() {
        await this.runner.migrate({
            fresh: true
        })

        const rollback = await this.runner.rollback()

        expect(rollback).equals(true)

        const hasTable = await Query.connection
            .firstRaw(`SELECT name
                       FROM sqlite_master
                       WHERE type = 'table'
                         AND name = '${this.tableName}';`) as {name: string}

        expect(hasTable).to.be.equal(undefined)
    }
}
