import { Container, Inject } from '../Container';
import { Storage } from '../Storage';
import { Http, Request, Response } from '../Http';
import { Abstract, Constructor } from '../Support';
import { MiddlewareInterface, RequestHandler } from './Middleware';
import { Route } from './Route';
import { Application } from '../Framework';
import { RouteNotFoundError } from './RouteNotFoundError';

export class Router {

    @Inject()
    app: Container;

    routes: Route[] = [];

    middleware: Abstract<MiddlewareInterface>[] = [];

    add(
        uri: string,
        method: Http.Method,
        controller: Constructor,
        action: string,
        name: string = action,
        middleware: Abstract<MiddlewareInterface>[] = []
    ): Route {
        uri = this.prepareUri(uri);
        const route = new Route(uri, method, controller, action, name, middleware);
        this.routes.push(route);
        return route;
    }

    async handle(app: Application, request: Request): Promise<Response> {
        const container = app.createChildContainer();

        container.forceSet('Request', request);
        const route = this.getRoute(request.uri || '', request.method);
        container.forceSet('Route', route);

        let stack: RequestHandler = async () => {
            if (!route) {
                throw new RouteNotFoundError([request.method, request.uri].join(' '));
            }
            request.parameters = route.parameters;

            let routeStack: RequestHandler = async () => {
                const content = await route.run(request, container);

                if (content instanceof Response) {
                    return content;
                }

                return Response.ok(content);
            };

            route.middleware.forEach(middlewareClass => {
                const middleware = container.get(middlewareClass);
                routeStack = middleware.handle.bind(middleware, request, routeStack);
            });

            return routeStack(request);
        };

        this.middleware.forEach(middlewareClass => {
            const middleware = container.get(middlewareClass);
            stack = middleware.handle.bind(middleware, request, stack);
        });

        return stack(request);
    }

    public loadControllers(directory: string) {
        this.app.get(Storage)
            .files(directory, true)
            .whereIn('extension', ['ts'])
            .forEach(file => require(file.path));
    }

    private getRoute(uri: string, method: string): Route | undefined {
        uri = this.prepareUri(uri);

        return this.routes.find(route => {
            return route.method === method && route.matches(uri);
        });
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
            uri = uri.substr(1);
        }
        if (uri[uri.length - 1] === '/') {
            uri = uri.substring(0, uri.length - 1);
        }
        return uri;
    }
}
