import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { Column, Connection, Entity, Options, PrimaryColumn, Query } from '../../Database'
import { User } from './Entities/User'
import { Role } from './Entities/Role'
import { SqliteDriver } from '@Typetron/Database/Drivers'

@suite
class SchemaTest {

    async before() {
        Query.connection = new Connection(new SqliteDriver(':memory:'))
        // Query.connection = new Connection(new MysqlDriver({
        //     host: 'localhost', user: 'root', password: 'root', database: 'typetron_test'
        // }))
    }

    @test
    async createsPivotTable() {
        await Query.connection.driver.schema.synchronize([User, Role].pluck('metadata'))

        const tableName = [User.getTable(), Role.getTable()].sort().join('_')
        const table = await Query.connection.tableExists(tableName)
        expect(Boolean(table)).to.be.equal(true, 'Pivot table was not created')
        const tableColumns = await Query.connection.tableColumns(tableName) as {name: string, type: string}[]
        expect(tableColumns).to.have.length(2)
        // expect(tableColumns[0]).to.deep.include({name: 'id', type: 'integer'});
        expect(tableColumns[0]).to.deep.include({name: 'roleId'})
        expect(tableColumns[1]).to.deep.include({name: 'userId'})
    }

    @test
    async leavesUnchangedTablesAlone() {
        await this.synchronize(Thing)
        await this.insertThing()
        const queries = this.recordQueries()

        await this.synchronize(Thing)

        expect(queries.filter(query => /CREATE|DROP|ALTER/.test(query))).to.be.empty
        expect(await this.things()).to.have.length(1)
    }

    @test
    async addsNewColumnsAndKeepsRows() {
        await this.synchronize(Thing)
        await this.insertThing()

        await this.synchronize(ThingWithColor)

        const columns = await Query.connection.tableColumns('things') as {name: string}[]
        expect(columns.pluck('name')).to.include('color')
        expect(await this.things()).to.deep.equal([{id: 1, name: 'lamp', color: null}])
    }

    @test
    async recoversFromATemporaryTableLeftByAnInterruptedRebuild() {
        await this.synchronize(Thing)
        await this.insertThing()
        await Query.connection.driver.run('CREATE TABLE things_alter_tmp (id integer)')

        await this.synchronize(ThingWithColor)

        expect(await this.things()).to.have.length(1)
        expect(Boolean(await Query.connection.tableExists('things_alter_tmp'))).to.be.equal(false)
    }

    @test
    async failedRebuildKeepsTheOriginalTable() {
        await this.synchronize(Thing)
        await this.insertThing()
        const driver = Query.connection.driver
        const run = driver.run.bind(driver)
        driver.run = async (query, params) => {
            if (query.includes('INSERT INTO things_alter_tmp')) {
                throw new Error('Copy failed')
            }
            return run(query, params)
        }

        await this.synchronize(ThingWithColor).then(
            () => expect.fail('Expected the rebuild to fail'),
            error => expect(error.message).to.equal('Copy failed')
        )
        driver.run = run

        expect(await this.things()).to.deep.equal([{id: 1, name: 'lamp'}])
        expect(Boolean(await Query.connection.tableExists('things_alter_tmp'))).to.be.equal(false)
    }

    private async synchronize(entity: typeof Entity) {
        await Query.connection.driver.schema.synchronize([entity].pluck('metadata'))
    }

    private async insertThing() {
        await Query.connection.driver.run('INSERT INTO things (name) VALUES (\'lamp\')')
    }

    private async things() {
        return await Query.connection.driver.get('SELECT * FROM things', [])
    }

    private recordQueries() {
        const queries: string[] = []
        const driver = Query.connection.driver
        const run = driver.run.bind(driver)
        driver.run = async (query, params) => {
            queries.push(query)
            return run(query, params)
        }
        return queries
    }
}

@Options({table: 'things'})
class Thing extends Entity {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}

@Options({table: 'things'})
class ThingWithColor extends Entity {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    color: string
}
