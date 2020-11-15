// noinspection TypeScriptPreferShortImport
import '../Support/Math'
import { Handler, Http, Request } from '../Http'
import { IncomingHttpHeaders } from 'http'
import { Container } from '../Container'
import { Application } from '../Framework'
import { Router } from '../Router'
import { Auth } from '../Framework/Auth'

export abstract class TestCase {
    app: Container
    userId: number

    abstract async bootstrapApp(): Promise<void>;

    async before() {
        await this.bootstrapApp()
        delete this.userId
    }

    loginById(id: number) {
        this.userId = id
    }

    get(routeName: string, content = {}, headers: IncomingHttpHeaders = {}) {
        return this.request(Http.Method.GET, routeName, content, headers)
    }

    post(route: string | [string, Record<string, string | number>], content = {}, headers: IncomingHttpHeaders = {}) {
        return this.request(Http.Method.POST, route, content, headers)
    }

    patch(route: string | [string, Record<string, string | number>], content = {}, headers: IncomingHttpHeaders = {}) {
        return this.request(Http.Method.PATCH, route, content, headers)
    }

    put(route: string | [string, Record<string, string | number>], content = {}, headers: IncomingHttpHeaders = {}) {
        return this.request(Http.Method.PUT, route, content, headers)
    }

    delete(route: string | [string, Record<string, string | number>], content = {}, headers: IncomingHttpHeaders = {}) {
        return this.request(Http.Method.DELETE, route, content, headers)
    }

    private async request(
        method: Http.Method,
        routeName: string | [string, Record<string, string | number>],
        content = {},
        headers: IncomingHttpHeaders = {}
    ) {
        let routeParameters = {}
        if (typeof routeName !== 'string') {
            [routeName, routeParameters] = routeName
        }

        const router = this.app.get(Router)
        const route = router.routes.findWhere('name', routeName)
        if (!route) {
            throw new Error(`Route '${routeName}' not found`)
        }
        route.parameters = this.convertRouteParametersToString(routeParameters) || {}

        if (this.userId) {
            const token = this.app.get(Auth).loginById(this.userId)
            headers.authorization = `Bearer ${token}`
        }

        const request = new Request(route.getUrl(), method, {}, {}, headers, content)

        const response = await this.app.get(Handler).handle(this.app as Application, request)

        if (response.content instanceof Buffer) {
            response.content = response.content.toString()
        }

        return response
    }

    private convertRouteParametersToString(routeParameters: Record<string, string | number>) {
        Object.keys(routeParameters).forEach(key => {
            routeParameters[key] = String(routeParameters[key])
        })
        return routeParameters as Record<string, string>
    }
}
