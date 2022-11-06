import { suite, test } from '@testdeck/mocha'
import { Create } from '@Typetron/Database/Drivers/MySQL/Create'
import { expectQuery } from '@Typetron/tests/Database/utils'

@suite
class CreateTest {

    @test
    async createsEmptyTable() {
        const statement = new Create('test')
        expectQuery(statement).toEqual('CREATE TABLE test ( )')
    }

    @test
    async createsTableWithIntegerColumn() {
        const statement = new Create('test', [{
            name: 'age',
            type: 'integer',
        }])
        expectQuery(statement).toEqual('CREATE TABLE test ( age integer )')
    }

    @test
    async createsTableWithPrimaryAutoIncrementColumn() {
        const statement = new Create('test', [{
            name: 'id',
            type: 'integer',
            primaryKey: true,
            autoIncrement: 1
        }])
        expectQuery(statement).toEqual(`
            CREATE TABLE test
            (
                id integer AUTO_INCREMENT,
                PRIMARY KEY (id)
            )
        `)
    }
}
