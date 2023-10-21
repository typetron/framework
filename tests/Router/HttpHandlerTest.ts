import { suite, test } from '@testdeck/mocha'
import { Handler, Http, Request } from '../../Router/Http'
import { expect } from 'chai'
import { Container } from '@Typetron/Container'
import { Body, Controller, Get } from '../../Router'

@suite
class HttpHandlerTest {
    private container: Container

    async before() {
        this.container = new Container()
        Container.setInstance(this.container)
    }

    @test
    'gives error when two routes have the same path'() {

        class MyController {
            index() {}
        }

        const handler = this.container.get(Handler)
        handler.addRoute('', Http.Method.GET, MyController, 'index', 'index')

        expect(() => handler.addRoute('', Http.Method.POST, MyController, 'index', 'index'))
            .to.not.throw(`There is already a route with the same url: [GET] ''`)
        expect(() => handler.addRoute('', Http.Method.GET, MyController, 'index', 'index'))
            .to.throw(`There is already a route with the same url: [GET] ''`)
    }

    @test
    async 'returns the value from the @Body'() {
        @Controller()
        class MyController {
            @Get('list')
            list(@Body() value: string) {
                return value
            }

            @Get('create')
            create(@Body() value: string) {
                return value
            }
        }

        const router = this.container.get(Handler)

        const listContent = await router.handle(this.container, new Request('list', Http.Method.GET, undefined, {}, 'test'))
        expect(listContent.body).to.be.equal('test')

        const createContent = await router.handle(this.container, new Request('create', Http.Method.GET))
        expect(createContent.body).to.be.equal(undefined)
    }

    // @test
    // async 'caches route urls'(done: Function) {
    //     class Controller {
    //         index() {}
    //     }
    //
    //     const router = new Router()
    //     router.add('', Http.Method.GET, Controller, 'index', 'index')
    //
    //     expect(router.cachedRoutes).to.be.have.length(0)
    //
    //     const app = new Container()
    //     const request = new Request('', Http.Method.GET)
    //     await router.handle(app as Application, request)
    //     expect(router.findRouteIndex).to.be.called.once // ???
    // }
}
