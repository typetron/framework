import { Container, Inject } from '../../Container'
import { RequestHandler, RouteNotFoundError, Router } from '../'
import { ErrorHandlerInterface, Http, Response } from './'
import { Request } from './Request'
import { HttpRoute as Route } from './HttpRoute'
import { AppConfig } from '../../Framework'
import { Request as BaseRequest } from '../Request'
import { Abstract, Constructor, Type } from '@Typetron/Support'
import { AppServer, nodeServer, uNetworkingServer } from '@Typetron/Router/Servers'
import { HttpMiddleware } from '@Typetron/Router/Http/Middleware'

const httpServers: Record<AppConfig['server'], AppServer> = {
    node: nodeServer,
    uNetworking: uNetworkingServer
}

export class Handler {
    @Inject()
    router: Router

    @Inject()
    errorHandler: ErrorHandlerInterface

    cachedRoutes: Record<string, [Route, Record<string, string>]> = {}

    addRoute(
        uri: string,
        method: Http.Method,
        controller: Constructor,
        action: string,
        name: string,
        parametersTypes: (Type<(...args: any[]) => any> | FunctionConstructor)[] = [],
        middleware: Abstract<HttpMiddleware>[] = []
    ): Route {
        uri = this.prepareUri(uri)
        const route = new Route(uri, method, name, controller, action, parametersTypes, middleware)
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
        const startServer = httpServers[config.server]

        startServer(config.port, async (request) => {
            try {
                return await this.handle(app, request)
            } catch (error) {
                return this.errorHandler.handle(error as Error)
            }
        })
    }

    async handle(app: Container, request: Request): Promise<Response> {
        const container = app.createChildContainer()

        container.set(BaseRequest, request)
        container.set(Request, request)

        let stack: RequestHandler = async () => {
            const [route, parameters] = this.cachedRoutes[`${request.method} ${request.uri}`]
            ?? this.findRouteIndex(request.uri ?? '', request.method)

            container.set(Route, route)
            request.parameters = parameters

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

            return routeStack(request)
        }

        this.router.middleware.global?.forEach(middlewareClass => {
            const middleware = container.get(middlewareClass)
            stack = middleware.handle.bind(middleware, request, stack)
        })

        this.router.middleware.http?.forEach(middlewareClass => {
            const middleware = container.get(middlewareClass)
            stack = middleware.handle.bind(middleware, request, stack)
        })

        return stack(request)
    }

    matches(uri: string, route: Route) {
        const uriParts = uri.split('/') // ex: ['users', '1', 'posts'];
        let part
        let parameterTypeIndex = 0
        const parameters: Record<string, string> = {}
        for (part = 0; part < uriParts.length; part++) {
            if (!route.uriParts[part]) {
                return false
            }
            if (route.uriParts[part].type === 'parameter' && route.hasCorrectPrimitiveType(parameterTypeIndex, uriParts[part])) {
                parameterTypeIndex++
                parameters[route.uriParts[part].name] = uriParts[part]
                continue
            }

            if (route.uriParts[part].name !== uriParts[part]) {
                return false
            }
        }

        if (part !== route.uriParts.length) {
            return false
        }
        return parameters
    }

    private findRouteIndex(uri: string, method: string): [Route, Record<string, string> | undefined] {
        const preparedUri = this.prepareUri(uri)

        for (const route of this.router.routes) {
            if (route.method.toLowerCase() === method.toLowerCase()) {
                const parameters = this.matches(preparedUri, route)

                if (parameters) {
                    this.cachedRoutes[`${method} ${uri}`] = [route, parameters]
                    return [route, parameters]
                }
            }
        }

        throw new RouteNotFoundError(`[${method}] ${uri}`)
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
