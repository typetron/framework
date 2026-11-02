import { suite, test } from '@testdeck/mocha'
import { BelongsTo, Column, Entity, HasOne, ID, Options, PrimaryColumn, Relation, SqliteDriver } from '@Typetron/Database'
import { anyString, instance, mock, when } from '@Typetron/node_modules/ts-mockito'
import { Schema } from '@Typetron/Database/Drivers/SQLite/Schema'
import { expectQuery } from '@Typetron/tests/Database/utils'
import { expect } from 'chai'
import { DatabaseDriver } from '@Typetron/Database/Drivers/DatabaseDriver'

@suite
class SqliteDriverTest {

    driver: DatabaseDriver
    schema: Schema
    query: string

    async before() {
        this.driver = mock(SqliteDriver)
        this.schema = new Schema(instance(this.driver))
        when(this.driver.run(anyString())).thenCall((query: string) => this.query = query)
    }

    @test
    async createsEmptyTable() {
        @Options()
        class Test extends Entity {}

        await this.schema.synchronize([Test].pluck('metadata'))
        expectQuery(this.query).toEqual('CREATE TABLE Test ( )')
    }

    @test
    async createsTableWithIntegerColumn() {
        class Test extends Entity {
            @Column()
            age: number
        }

        await this.schema.synchronize([Test].pluck('metadata'))
        expectQuery(this.query).toEqual('CREATE TABLE Test ( age integer )')
    }

    @test
    async createsTableWithPrimaryAutoIncrementColumn() {
        class Test extends Entity {
            @PrimaryColumn()
            id: ID
        }

        await this.schema.synchronize([Test].pluck('metadata'))
        expectQuery(this.query).toEqual(`
            CREATE TABLE Test
            (
                id integer PRIMARY KEY AUTOINCREMENT
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
            CREATE TABLE Image
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

        const queries: string[] = []
        when(this.driver.run(anyString())).thenCall((query: string) => queries.push(query))

        class User extends Entity {
            @Column()
            column1: number

            @Column()
            column2: string
        }

        await this.schema.synchronize([User].pluck('metadata'))

        expect(queries).to.have.length(7)
        expectQuery(queries[0]).toEqual('BEGIN IMMEDIATE')
        expectQuery(queries[1]).toEqual('DROP TABLE IF EXISTS User_alter_tmp')
        expectQuery(queries[2]).toEqual(`
            CREATE TABLE User_alter_tmp
            (
                column1 integer,
                column2 varchar(255)
            )
        `)

        expectQuery(queries[3]).toEqual(`
            INSERT INTO User_alter_tmp(column2)
            SELECT column2
            FROM User
        `)

        expectQuery(queries[4]).toEqual(`DROP TABLE User`)
        expectQuery(queries[5]).toEqual(`ALTER TABLE User_alter_tmp RENAME TO User`)
        expectQuery(queries[6]).toEqual('COMMIT')
    }
}
