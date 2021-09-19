import { suite, test } from '@testdeck/mocha'
import { Handler } from '../../Router/Websockets'
import { expect } from 'chai'
import { Container } from '@Typetron/Container'

@suite
class HttpHandlerTest {

    @test
    'gives error when two events have the same path'() {
        const container = new Container()

        class Controller {
            list() {}
        }

        const router = container.get(Handler)
        router.addEvent('list', Controller, 'list')

        expect(() => router.addEvent('list', Controller, 'index')).to.throw(`There is already an event with the same name: 'list'`)
    }

}
