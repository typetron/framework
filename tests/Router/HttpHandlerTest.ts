import { suite, test } from '@testdeck/mocha'
import { Handler, Http } from '../../Router/Http'
import { expect } from 'chai'
import { Container } from '@Typetron/Container'

@suite
class HttpHandlerTest {

    @test
    'gives error when two routes have the same path'() {
        const container = new Container()

        class Controller {
            index() {}
        }

        const handler = container.get(Handler)
        handler.addRoute('', Http.Method.GET, Controller, 'index', 'index')

        expect(() => handler.addRoute('', Http.Method.POST, Controller, 'index', 'index')).to.not.throw(`There is already a route with the same url: [GET] ''`)
        expect(() => handler.addRoute('', Http.Method.GET, Controller, 'index', 'index')).to.throw(`There is already a route with the same url: [GET] ''`)
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
