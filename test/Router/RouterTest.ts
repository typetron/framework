import { suite, test } from '@testdeck/mocha'
import { Router } from '../../Router'
import { Http } from '../../Web'
import { expect } from 'chai'

@suite
class RouterTest {

    @test
    'gives error when two routes have the same path'() {
        class Controller {
            index() {}
        }

        const router = new Router()
        router.add('', Http.Method.GET, Controller, 'index', 'index')

        expect(() => router.add('', Http.Method.POST, Controller, 'index', 'index')).to.not.throw(`There is already a route with the same url: [GET] ''`)
        expect(() => router.add('', Http.Method.GET, Controller, 'index', 'index')).to.throw(`There is already a route with the same url: [GET] ''`)
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
