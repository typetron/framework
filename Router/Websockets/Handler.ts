import { Container, Inject } from '../../Container'
import { RequestHandler, Router } from '../../Router'
import { Response } from '../Http'
import { Request as BaseRequest } from '../Request'
import { Abstract, Constructor, Type } from '../../Support'
import { WebsocketRoute } from './WebsocketRoute'
import { Request } from '@Typetron/Router/Websockets/Request'
import { WebsocketMiddleware } from '@Typetron/Router/Websockets/Middleware'

export class Handler {
    @Inject()
    router: Router

    onOpen?: WebsocketRoute
    onClose?: WebsocketRoute

    addAction(
        name: string,
        controller: Constructor,
        actionName: string,
        parametersTypes: (Type<(...args: any[]) => any> | FunctionConstructor)[] = [],
        middleware: Abstract<WebsocketMiddleware>[] = []
    ) {
        const action = new WebsocketRoute(
            name,
            controller,
            actionName,
            parametersTypes,
            middleware
        )
        if (this.router.actions.has(name)) {
            throw new Error(`There is already an action with the same name: '${name}'`)
        }
        this.router.actions.set(name, action)
        return action
    }

    async handle<T = unknown>(container: Container, request: Request): Promise<Response<T>> {

        container.set(BaseRequest, request)
        container.set(Request, request)

        let stack: RequestHandler = async () => {
            const route = this.router.actions.get(request.name)

            if (!route) {
                throw new Error(`Action '${request.name}' not found`)
            }

            container.set(WebsocketRoute, route)

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

        this.router.middleware.global?.forEach(middlewareClass => {
            const middleware = container.get(middlewareClass)
            stack = middleware.handle.bind(middleware, request, stack)
        })

        await this.router.middleware.websocket?.forEachAsync(async middlewareClass => {
            const middleware = await container.get(middlewareClass)
            stack = middleware.handle.bind(middleware, request, stack)
        })

        return await stack(request) as Response<T>
    }
}
