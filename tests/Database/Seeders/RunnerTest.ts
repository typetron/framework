import { suite, test } from '@testdeck/mocha'
import { Seeder } from '@Typetron/Database/Seeders'
import { expect } from 'chai'
import { Connection, Query, SqliteDriver } from '../../../Database'
import { Storage } from '../../../Storage'

@suite
class RunnerTest {
    private runner: Seeder
    private seedsPath = './tests/Database/Seeders/seeds'
    private seedFiles = ['RandomSeeder']

    async before() {
        Query.connection = new Connection(new SqliteDriver(':memory:'))
        // Query.connection = new Connection(new MysqlDriver({
        //     host: 'localhost', user: 'root', password: 'root', database: 'typetron_test'
        // }))
        await Query.connection.runRaw('CREATE TABLE random_table (col1 varchar)')

        this.runner = new Seeder(new Storage(), Query.connection, this.seedsPath)
    }

    @test
    async shouldSeed() {
        await this.runner.seed()

        const result = await Query.table<{ col1: string }>('random_table').first()
        
        expect(result?.col1).to.be.equal('val1')
    }
}
