import { Container, Inject } from '../../Container'
import { MiddlewareInterface, RequestHandler, Route, RouteNotFoundError, Router } from '../'
import { ErrorHandlerInterface, Http, Response } from './'
import { Request } from './Request'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { AppConfig } from '../../Framework'
import { Abstract, Constructor, Type } from '@Typetron/Support'

export class Handler {
    @Inject()
    router: Router

    @Inject()
    errorHandler: ErrorHandlerInterface

    cachedRoutes: Record<string, number> = {}

    addRoute(
        uri: string,
        method: Http.Method,
        controller: Constructor,
        action: string,
        name: string,
        parametersTypes: (Type<Function> | FunctionConstructor)[] = [],
        middleware: Abstract<MiddlewareInterface>[] = []
    ): Route {
        uri = this.prepareUri(uri)
        const route = new Route(uri, method, controller, action, name, parametersTypes, middleware)
        if (this.router.routes.find(item => item.uri === uri && item.method === method)) {
            throw new Error(`There is already a route with the same url: [${method}] '${uri}'`)
        }
        this.router.routes.push(route)
        return route
    }

    // async handle(app: Application, request: Request) {
    //     try {
    //         return await this.handle(app, request)
    //     } catch (error) {
    //         return this.errorHandler.handle(error, request)
    //     }
    // }

    startServer(app: Container): void {
        const config = app.get(AppConfig)

        const server = createServer(async (incomingMessage: IncomingMessage, serverResponse: ServerResponse) => {
            try {
                const request = await Request.capture(incomingMessage)
                const response = await this.handle(app, request)
                Response.send(serverResponse, response.status, response.body, response.headers)
            } catch (error) {
                const errorResponse = await this.errorHandler.handle(error)
                Response.send(serverResponse, errorResponse.status, errorResponse.body, errorResponse.headers)
            }
        })

        server.listen(config.port)
    }

    async handle(app: Container, request: Request): Promise<Response> {
        const container = app.createChildContainer()

        container.set(Request, request)

        let stack: RequestHandler = async () => {
            // const routeIndex = this.cachedRoutes[`${request.method} ${request.uri}`]
            //     ?? this.findRouteIndex(request.uri ?? '', request.method)
            const routeIndex = this.findRouteIndex(request.uri ?? '', request.method)

            const route = this.router.routes[routeIndex]

            container.set(Route, route)
            request.parameters = route.parameters

            let routeStack: RequestHandler = async () => {
                const content = await route.run(container)

                if (content instanceof Response) {
                    return content
                }

                return Response.ok(content)
            }

            route.middleware.forEach(middlewareClass => {
                const middleware = container.get(middlewareClass)
                routeStack = middleware.handle.bind(middleware, request, routeStack)
            })

            return routeStack(request)
        }

        this.router.middleware.forEach(middlewareClass => {
            const middleware = container.get(middlewareClass)
            stack = middleware.handle.bind(middleware, request, stack)
        })

        return stack(request)
    }

    private findRouteIndex(uri: string, method: string): number {
        const preparedUri = this.prepareUri(uri)

        const index = this.router.routes.findIndex(route => {
            return route.method === method && route.matches(preparedUri)
        })

        if (index === -1) {
            throw new RouteNotFoundError(`[${method}] ${uri}`)
        }

        this.cachedRoutes[`${method} ${uri}`] = index

        return index

        // return this.routes
        //     .where('uri', uri)
        //     .findWhere('method', method) || this.routeNotFound(uri);

        // const uriParts = uri.split('/'); // ['users', '1', 'posts'];
        //
        // let currentRoute: string | undefined;
        //
        // let routesGroup = this.routesMap;
        // uriParts.forEach(part => {
        //     if (routesGroup[part]) {
        //         return routesGroup = routesGroup[part];
        //     }
        //     if (routesGroup['*']) {
        //         return routesGroup = routesGroup['*'];
        //     }
        //
        //     throw new Error(`Route for '${uri}' not found`);
        // });

        // this.routes;
    }

    private prepareUri(uri: string) {
        if (uri[0] === '/') {
            uri = uri.substr(1)
        }
        if (uri[uri.length - 1] === '/') {
            uri = uri.substring(0, uri.length - 1)
        }
        return uri
    }
}
