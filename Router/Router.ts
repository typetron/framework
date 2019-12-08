import { Container, Inject } from '../Container';
import { Filesystem } from '../Filesystem';
import { ErrorHandlerInterface, Http, Request, Response } from '../Http';
import { Abstract } from '../Support';
import { Controller } from './Controller';
import { MiddlewareInterface, RequestHandler } from './Middleware';
import { Route } from './Route';
import { Application } from '../Framework';

export class Router {

    @Inject()
    app: Container;

    @Inject()
    filesystem: Filesystem;

    @Inject()
    errorHandler: ErrorHandlerInterface;

    routes: Route[] = [];

    middleware: Abstract<MiddlewareInterface>[] = [];

    add(uri: string, method: Http.Method, controller: typeof Controller, action: string, name: string = action, middleware: Abstract<MiddlewareInterface>[] = []) {
        uri = this.prepareUri(uri);
        this.routes.push(new Route(uri, method, controller, action, name, middleware));
    }

    async handle(app: Application, request: Request): Promise<Response> {
        const container = app.createChildContainer();

        container.set(Request, request);
        const route = this.getRoute(request.uri || '', request.method);
        container.set(Route, route);

        let stack: RequestHandler = async () => {
            if (!route) {
                return new Response(Http.Status.NOT_FOUND);
            }
            request.parameters = route.parameters;

            let routeStack: RequestHandler = async () => {
                const content = await route.run(request, container);

                if (content instanceof Response) {
                    return content;
                }

                return Response.ok(content);
            };

            for (let index = route.middleware.length - 1; index >= 0; index--) {
                const middleware = container.get(route.middleware[index]);

                routeStack = middleware.handle.bind(middleware, request, routeStack);
            }

            return routeStack(request);
        };

        for (let index = this.middleware.length - 1; index >= 0; index--) {
            const middleware = container.get(this.middleware[index]);

            stack = middleware.handle.bind(middleware, request, stack);
        }

        return stack(request);
    }

    public loadControllers(directory: string) {
        this.filesystem
            .files(directory, true)
            .whereIn('extension', ['ts'])
            .forEach(file => require(file.fullPath));
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
