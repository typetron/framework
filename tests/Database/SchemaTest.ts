import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { Connection, Query } from '../../Database'
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

}
