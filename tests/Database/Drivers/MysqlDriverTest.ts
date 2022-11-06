import { suite, test } from '@testdeck/mocha'
import { BelongsTo, Column, Entity, HasOne, ID, MysqlDriver, Options, PrimaryColumn, Relation } from '@Typetron/Database'
import { anyString, instance, mock, when } from 'ts-mockito'
import { Schema } from '@Typetron/Database/Drivers/MySQL/Schema'
import { expectQuery } from '../utils'
import { DatabaseDriver } from '@Typetron/Database/Drivers/DatabaseDriver'

@suite
class MysqlDriverTest {

    driver: DatabaseDriver
    schema: Schema
    query: string

    async before() {
        this.driver = mock(MysqlDriver)
        this.schema = new Schema(instance(this.driver))
        when(this.driver.run(anyString())).thenCall((query: string) => this.query = query)
    }

    @test
    async createsEmptyTable() {
        @Options()
        class Test extends Entity {}

        await this.schema.synchronize([Test].pluck('metadata'))
        expectQuery(this.query).toEqual('CREATE TABLE test ( )')
    }

    @test
    async createsTableWithIntegerColumn() {
        class Test extends Entity {
            @Column()
            age: number
        }

        await this.schema.synchronize([Test].pluck('metadata'))
        expectQuery(this.query).toEqual('CREATE TABLE test ( age integer )')
    }

    @test
    async createsTableWithPrimaryAutoIncrementColumn() {
        class Test extends Entity {
            @PrimaryColumn()
            id: ID
        }

        await this.schema.synchronize([Test].pluck('metadata'))
        expectQuery(this.query).toEqual(`
            CREATE TABLE test
            (
                id integer AUTO_INCREMENT,
                PRIMARY KEY (id)
            )
        `)
    }

    @test
    async createsTableWithForeignColumn() {
        class User extends Entity {
            @Column()
            @Relation(() => Image, 'user')
            image: HasOne<Image>
        }

        class Image extends Entity {
            @Column()
            @Relation(() => User, 'image')
            user: BelongsTo<User>
        }

        await this.schema.synchronize([Image].pluck('metadata'))
        expectQuery(this.query).toEqual(`
            CREATE TABLE image
            (
                userId integer
            )
        `)
    }

    @test
    async altersTable() {
        when(this.driver.tableExists(anyString())).thenReturn(Promise.resolve(true))
        when(this.driver.tableColumns(anyString())).thenReturn(Promise.resolve([
            {
                name: 'column2',
                type: 'integer'
            },
            {
                name: 'column3',
                type: 'integer'
            },
        ]))

        class User extends Entity {
            @Column()
            column1: number

            @Column()
            column2: string
        }

        await this.schema.synchronize([User].pluck('metadata'))

        expectQuery(this.query).toEqual(`
            ALTER TABLE user
                ADD column1 integer,
            MODIFY column2 varchar(255),
            DROP
            COLUMN column3
        `)
    }

    @test
    async altersTableAddPrimaryKey() {
        when(this.driver.tableExists(anyString())).thenReturn(Promise.resolve(true))
        when(this.driver.tableColumns(anyString())).thenReturn(Promise.resolve([]))

        class User extends Entity {
            @PrimaryColumn()
            id: ID
        }

        const queries: string[] = []
        when(this.driver.run(anyString())).thenCall((query: string) => queries.push(query))

        await this.schema.synchronize([User].pluck('metadata'))

        expectQuery(queries[0]).toEqual(`
            ALTER TABLE user
                ADD id integer
        `)

        expectQuery(queries[1]).toEqual(`
            ALTER TABLE user
                ADD CONSTRAINT PRIMARY KEY (id),
                MODIFY id integer AUTO_INCREMENT
        `)
    }
}
