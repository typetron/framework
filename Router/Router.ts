import { Container, Inject } from '../Container'
import { Storage } from '../Storage'
import { Http, Request, Response } from '../Web'
import { Abstract, Constructor, Type } from '../Support'
import { MiddlewareInterface, RequestHandler } from './Middleware'
import { Route } from './Route'
import { Application } from '../Framework'
import { RouteNotFoundError } from './RouteNotFoundError'

export class Router {

    @Inject()
    app: Container

    routes: Route[] = []
    cachedRoutes: Record<string, number> = {}

    middleware: Abstract<MiddlewareInterface>[] = []

    add(
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
        if (this.routes.find(item => item.uri === uri && item.method === method)) {
            throw new Error(`There is already a route with the same url: '${uri}'`)
        }
        this.routes.push(route)
        return route
    }

    async handle(app: Application, request: Request): Promise<Response> {
        const container = app.createChildContainer()

        container.forceSet('Request', request)

        let stack: RequestHandler = async () => {
            const routeIndex = this.cachedRoutes[`${request.method} ${request.uri}`]
                || this.findRouteIndex(request.uri || '', request.method)

            const route = this.routes[routeIndex]

            container.forceSet('Route', route)
            request.parameters = route.parameters

            let routeStack: RequestHandler = async () => {
                const content = await route.run(request, container)

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

        this.middleware.forEach(middlewareClass => {
            const middleware = container.get(middlewareClass)
            stack = middleware.handle.bind(middleware, request, stack)
        })

        return await stack(request)
    }

    public loadControllers(directory: string) {
        this.app.get(Storage)
            .files(directory, true)
            .whereIn('extension', ['ts'])
            .forEach(file => require(file.path))
    }

    private findRouteIndex(uri: string, method: string): number {
        uri = this.prepareUri(uri)

        const index = this.routes.findIndex(route => {
            return route.method === method && route.matches(uri)
        })

        if (index !== -1) {
            this.cachedRoutes[`${method} ${uri}`] = index
            return index
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
