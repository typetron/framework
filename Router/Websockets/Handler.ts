import { Container, Inject } from '../../Container'
import { MiddlewareInterface, RequestHandler, Router } from '../../Router'
import { Request, Response } from '../Http'
import { Abstract, Constructor, Type } from '../../Support'
import { WebsocketEvent } from './WebsocketEvent'

export class Handler {
    @Inject()
    router: Router

    onOpen?: WebsocketEvent
    onClose?: WebsocketEvent

    addEvent(
        name: string,
        controller: Constructor,
        action: string,
        parametersTypes: (Type<Function> | FunctionConstructor)[] = [],
        middleware: Abstract<MiddlewareInterface>[] = []
    ) {
        const event = new WebsocketEvent(
            name,
            controller,
            action,
            parametersTypes,
            middleware
        )
        if (this.router.events.has(name)) {
            throw new Error(`There is already an event with the same name: '${name}'`)
        }
        this.router.events.set(name, event)
        return event
    }

    async handle<T = unknown>(container: Container, request: Request): Promise<Response<T>> {

        container.set(Request, request)

        let stack: RequestHandler = async () => {
            const route = this.router.events.get(request.uri)

            if (!route) {
                throw new Error(`Event '${request.uri}' not found`)
            }

            // TODO - add the Websocket route in the container
            // container.set(Route, route)

            let routeStack: RequestHandler = async () => {
                const content = await route.run(container, request.parameters)

                if (content instanceof Response) {
                    return content
                }

                return Response.ok(content)
            }

            route.middleware.forEach(middlewareClass => {
                const middleware = container.get(middlewareClass)
                routeStack = middleware.handle.bind(middleware, request, routeStack)
            })

            return await routeStack(request)
        }

        this.router.middleware.forEach(middlewareClass => {
            const middleware = container.get(middlewareClass)
            stack = middleware.handle.bind(middleware, request, stack)
        })

        return await stack(request) as Response<T>
    }

}
