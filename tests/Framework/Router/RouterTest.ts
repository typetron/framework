import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { Action, Body, Controller, Get, Router } from '../../../Router'
import { App, Application } from '@Typetron/Framework'
import { AuthUser } from '../../../Framework/Auth'

@suite
class RouterTest {

    @test
    'registers http routes and websocket actions'() {
        App.instance = new Application('./tests')

        @Controller()
        class MyController {

            @Action()
            create(@AuthUser() user: string) {}

            @Get()
            list(@Body() content: number) {}

        }

        const router = App.instance.get(Router)

        expect(router.routes).to.have.length(1)
        expect(router.actions).to.have.length(1)
        expect(router.routes[0]).to.deep.include({name: 'list'})
        expect(router.actions.get('create')).to.deep.include({name: 'create'})
    }

}
