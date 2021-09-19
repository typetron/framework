import { suite, test } from '@testdeck/mocha'
import { Container } from '@Typetron/Container'
import { Column, Connection, Entity, ID, Query, SqliteDriver } from '@Typetron/Database'
import { Handler } from '@Typetron/Router/Websockets'
import { Type } from '@Typetron/Support'
import { Http, Request, Response } from '@Typetron/Router/Http'
import { anyOfClass, instance, mock, when } from 'ts-mockito'
import { EntityResolver } from '@Typetron/Framework/Resolvers/EntityResolver'
import { expect } from 'chai'

@suite
class EntityResolverTest {

    @test
    async 'resolves entity parameters'() {
        const connection = mock(Connection)
        Query.connection = instance(connection)
        Query.connection.driver = new SqliteDriver(':memory:')
        when(connection.first(anyOfClass(Query))).thenResolve({id: 2}, {id: 1})

        const container = new Container()
        container.resolvers.unshift(new EntityResolver(container))

        class User extends Entity {
            @Column()
            id: ID
        }

        class Controller {
            read(thisUser: User, thatUser: User) {
                return [thisUser.id, thatUser.id]
            }
        }

        const handler = container.get(Handler)
        handler.addEvent('read', Controller, 'read', [User as unknown as Type<Function>, User as unknown as Type<Function>])

        const request = new Request('read', Http.Method.GET)
        request.parameters = {
            0: 2,
            1: 1
        }
        const response: Response<[ID, ID]> = await handler.handle(container, request)

        expect(response.body[0]).to.be.equal(2)
        expect(response.body[1]).to.be.equal(1)
    }
}
