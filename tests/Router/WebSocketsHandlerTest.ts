import { suite, test } from '@testdeck/mocha'
import { Handler } from '../../Router/Websockets'
import { expect } from 'chai'
import { Container } from '@Typetron/Container'
import { Action, Body, Controller } from '../../Router'
import { Request } from '../../Router/Request'

@suite
class WebSocketsHandlerTest {

    @test
    'gives error when two actions have the same path'() {
        const container = new Container()

        class Controller {
            list() {}
        }

        const router = container.get(Handler)
        router.addAction('list', Controller, 'list')

        expect(() => router.addAction('list', Controller, 'index')).to.throw(`There is already an action with the same name: 'list'`)
    }

    @test
    async 'returns the value from the @Body'() {
        const container = Container.getInstance()

        @Controller()
        class MyController {
            @Action()
            list(@Body() value: string) {
                return value
            }

            @Action()
            create(@Body() value: string) {
                return value
            }
        }

        const router = container.get(Handler)

        const listContent = await router.handle(container, new Request('list', 'test'))
        expect(listContent.body).to.be.equal('test')

        const createContent = await router.handle(container, new Request('create'))
        expect(createContent.body).to.be.equal(undefined)
    }

}
