import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { anyOfClass, instance, mock, when } from 'ts-mockito'
import { Connection, PostgresDriver, Query } from '@Typetron/Database'
import { toPostgresSQL } from '@Typetron/Database/Drivers/Postgres/Helpers'
import { expectQuery } from '@Typetron/tests/Database/utils'

@suite
class StatementsTest {
    sql: string

    before() {
        const connection = mock(Connection)
        Query.connection = instance(connection)
        Query.connection.driver = new PostgresDriver({})
        when(connection.run(anyOfClass(Query))).thenCall((query: Query) => this.sql = query.toSQL())
    }

    @test
    async translatesPlaceholdersAndQuotes() {
        expect(toPostgresSQL('SELECT * FROM `users` WHERE `users`.`id` = ? AND `name` = ?'))
            .to.equal('SELECT * FROM "users" WHERE "users"."id" = $1 AND "name" = $2')
    }

    @test
    async leavesQuotedTextUntouched() {
        expect(toPostgresSQL('SELECT \'it\'\'s ? `x`\', "a?b" FROM t WHERE c = ?'))
            .to.equal('SELECT \'it\'\'s ? `x`\', "a?b" FROM t WHERE c = $1')
    }

    @test
    async selectsWithLimitAndOffset() {
        expectQuery(Query.table('users').limit(10, 5).toSQL()).toEqual('SELECT * FROM users LIMIT 5 OFFSET 10')
        expectQuery(Query.table('users').limit(3).toSQL()).toEqual('SELECT * FROM users LIMIT 3')
    }

    @test
    async rejectsLimitInUpdateAndDelete() {
        expect(() => Query.table('users').where('id', 1).limit(1).toSQL()).not.to.throw()
        const update = await Query.table('users').where('id', 1).limit(1).update({name: 'John'}).catch(error => error)
        expect(update).to.be.instanceOf(Error).with.property('message').that.contains('LIMIT in UPDATE')
        const remove = await Query.table('users').where('id', 1).limit(1).delete().catch(error => error)
        expect(remove).to.be.instanceOf(Error).with.property('message').that.contains('LIMIT in DELETE')
    }

    @test
    async updatesWithQuotedColumns() {
        await Query.table('users').where('userId', 1).update({firstName: 'John'})
        expect(toPostgresSQL(this.sql)).to.equal('UPDATE "users" SET "firstName" = $1 WHERE "userId" = $2')
    }
}
