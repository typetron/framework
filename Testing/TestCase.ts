import '../Support/Math'
import { Handler, Http, Request, Response } from '../Web'
import { IncomingHttpHeaders } from 'http'
import { Application, DatabaseProvider } from '../Framework'
import { Router } from '../Router'
import { Auth, User } from '../Framework/Auth'

export abstract class TestCase {
    static app: Application
    app: Application
    userId?: number

    providersNeedingReboot = [
        DatabaseProvider
    ]

    abstract bootstrapApp(): Promise<Application>;

    async before() {
        if (!TestCase.app) {
            TestCase.app = this.app = await this.bootstrapApp()
            return
        }
        this.app = TestCase.app
        await this.app.registerProviders(this.providersNeedingReboot)
        delete this.userId
    }

    loginById(id: number) {
        this.userId = id
    }

    login(user: User) {
        this.loginById(user.id)
    }

    get<T extends string | object | undefined>(routeName: string, content = {}, headers: IncomingHttpHeaders = {}): Promise<Response<T>> {
        return this.request(Http.Method.GET, routeName, content, headers) as Promise<Response<T>>
    }

    post<T extends string | object | undefined>(
        route: string | [string, Record<string, string | number>],
        content = {},
        headers: IncomingHttpHeaders = {}
    ): Promise<Response<T>> {
        return this.request(Http.Method.POST, route, content, headers) as Promise<Response<T>>
    }

    patch<T extends string | object | undefined>(
        route: string | [string, Record<string, string | number>],
        content = {},
        headers: IncomingHttpHeaders = {}
    ): Promise<Response<T>> {
        return this.request(Http.Method.PATCH, route, content, headers) as Promise<Response<T>>
    }

    put<T extends string | object | undefined>(
        route: string | [string, Record<string, string | number>],
        content = {},
        headers: IncomingHttpHeaders = {}
    ): Promise<Response<T>> {
        return this.request(Http.Method.PUT, route, content, headers) as Promise<Response<T>>
    }

    delete<T extends string | object | undefined>(
        route: string | [string, Record<string, string | number>],
        content = {},
        headers: IncomingHttpHeaders = {}
    ): Promise<Response<T>> {
        return this.request(Http.Method.DELETE, route, content, headers) as Promise<Response<T>>
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
            this.app.set(Auth, undefined)
            headers.authorization = `Bearer ${token}`
        }

        const request = new Request(route.getUrl(), method, {}, {}, headers, content)

        const response = await this.app.get(Handler).handle(this.app as Application, request)

        if (response.body instanceof Buffer) {
            response.body = response.body.toString()
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
