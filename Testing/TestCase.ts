import '../Support/Math'
import { ErrorHandlerInterface, Handler as HTTPHandler, Http, HttpError, Request, Response } from '../Router/Http'
import { IncomingHttpHeaders } from 'http'
import { Application, DatabaseProvider } from '../Framework'
import { Router } from '../Router'
import { Auth, User } from '../Framework/Auth'
import { EventRequest } from '../Router/Websockets/types'
import { Handler as WebsocketsHandler, WebSocket } from '../Router/Websockets'
import { Container } from '../Container'
import { ID } from '@Typetron/Database'
import { anything, instance, mock, when } from 'ts-mockito'
import { Crypt } from '@Typetron/Encryption'

export abstract class TestCase {
    static app: Application
    app: Container

    // tslint:disable-next-line:no-any
    eventListeners = new Map<string, (response: any) => void>()

    providersNeedingReboot = [
        DatabaseProvider
    ]

    abstract bootstrapApp(): Promise<Application>;

    async before() {
        if (!TestCase.app) {
            TestCase.app = await this.bootstrapApp()
        }
        await TestCase.app.registerProviders(this.providersNeedingReboot)
        this.app = TestCase.app.createChildContainer()

        const crypt = mock(Crypt)
        when(crypt.hash(anything(), anything())).thenCall(value => `testing-${value}`)
        when(crypt.compare(anything(), anything())).thenCall((first, second) => Promise.resolve(`testing-${first}` === second))

        this.app.set(Crypt, instance(crypt))
    }

    async loginById(id: ID) {
        await this.app.get(Auth).loginById(id)
    }

    /**
     * @deprecated
     */
    async login(user: User) {
        await this.loginById(user.id)
    }

    async actingAs(user: User) {
        await this.app.get(Auth).loginUser(user)
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

    async event<T extends string | object | undefined>(event: string, content?: EventRequest['message']): Promise<Response<T>> {
        const socketMock = mock(WebSocket)

        when(socketMock.publishAndSend(anything(), anything(), anything())).thenCall((topic, calledEvent, message) => {
            const callback = this.eventListeners.get(calledEvent)
            callback?.(message)
        })

        when(socketMock.send(anything(), anything())).thenCall((calledEvent, message) => {
            const callback = this.eventListeners.get(calledEvent)
            callback?.(message)
        })

        const container = this.app.createChildContainer()
        container.set(WebSocket, instance(socketMock))

        const request = new Request(event, Http.Method.GET,
            {},
            {},
            {},
            content?.body ?? {}
        )

        // TODO find a way to save parameters so they can be retrieved easily in the Resolvers (check EntityResolver for example)
        content?.parameters?.forEach(parameter => {
            request.parameters[String.random(15)] = parameter
        })

        try {
            return await this.app.get(WebsocketsHandler).handle(container, request)
        } catch (error) {
            if (error instanceof HttpError) {
                const errorResponse = await this.app.get(ErrorHandlerInterface).handle(error)
                console.error(errorResponse.body)
                return errorResponse as Response<T>
            }
            throw error
        }
    }

    on<T>(event: string, callback: (response: T) => void) {
        this.eventListeners.set(event, callback)
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

        const auth = this.app.get(Auth)
        if (auth.id) {
            const token = await auth.sign(auth.id)
            headers.authorization = `Bearer ${token}`
        }

        const request = new Request(route.getUrl(), method, {}, headers, {}, content)

        let response: Response
        try {
            response = await this.app.get(HTTPHandler).handle(this.app as Application, request)

            if (response.body instanceof Buffer) {
                response.body = response.body.toString()
            }

            return response

        } catch (error) {
            if (error instanceof HttpError) {
                return this.app.get(ErrorHandlerInterface).handle(error)
            }
            throw error
        }
    }

    private convertRouteParametersToString(routeParameters: Record<string, string | number>) {
        Object.keys(routeParameters).forEach(key => {
            routeParameters[key] = String(routeParameters[key])
        })
        return routeParameters as Record<string, string>
    }
}
