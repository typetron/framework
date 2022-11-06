import { suite, test } from '@testdeck/mocha'
import { expectQuery } from '@Typetron/tests/Database/utils'
import { AddColumn, AddConstraint, Alter, Constraints, DropColumn, ModifyColumn } from '@Typetron/Database/Drivers/MySQL/Alter'

@suite
class AlterTest {

    @test
    async addColumn() {
        const addAge = new AddColumn({
            name: 'age',
            type: 'integer',
        })
        const statement = new Alter('test', [addAge])
        expectQuery(statement).toEqual('ALTER TABLE test ADD age integer')
    }

    @test
    async addPrimaryKeyColumn() {
        const addAge = new AddColumn({
            name: 'age',
            type: 'integer',
        })
        const statement = new Alter('test', [addAge])
        expectQuery(statement).toEqual('ALTER TABLE test ADD age integer')
    }

    @test
    async dropColumn() {
        const age = new DropColumn('age')
        const statement = new Alter('test', [age])
        expectQuery(statement).toEqual('ALTER TABLE test DROP COLUMN age')
    }

    @test
    async ModifyColumn() {
        const age = new ModifyColumn({
            name: 'age',
            type: 'integer',
        })
        const statement = new Alter('test', [age])
        expectQuery(statement).toEqual('ALTER TABLE test MODIFY age integer')
    }

    @test
    async ModifyColumnWithAutoIncrement() {
        const age = new ModifyColumn({
            name: 'age',
            type: 'integer',
            autoIncrement: 1
        })
        const statement = new Alter('test', [age])
        expectQuery(statement).toEqual('ALTER TABLE test MODIFY age integer AUTO_INCREMENT')
    }

    @test
    async addPrimaryKeyConstraint() {
        const age = new AddConstraint({
            name: 'age',
            type: 'integer',
        }, Constraints.PrimaryKey)
        const statement = new Alter('test', [age])
        expectQuery(statement).toEqual('ALTER TABLE test ADD CONSTRAINT PRIMARY KEY (age)')
    }

    @test
    async addForeignKeyConstraint() {
        const age = new AddConstraint({
            name: 'age',
            type: 'integer',
        }, Constraints.ForeignKey)
        const statement = new Alter('test', [age])
        expectQuery(statement).toEqual('ALTER TABLE test ADD CONSTRAINT FOREIGN KEY (age)')
    }

    @test
    async altersMultipleColumns() {
        const addAge = new AddColumn({
            name: 'age',
            type: 'integer',
        })
        const dropName = new DropColumn('age')
        const dropTitle = new DropColumn('title')

        const addAddress = new AddColumn({
            name: 'address',
            type: 'varchar(255)',
        })
        const statement = new Alter('test', [addAge, dropName, dropTitle, addAddress])
        expectQuery(statement).toEqual(`
            ALTER TABLE test
                ADD age integer,
            DROP
            COLUMN age,
                DROP
            COLUMN title,
                ADD address varchar(255)
        `)
    }
}
