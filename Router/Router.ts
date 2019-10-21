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

    public routes: Route[] = [];
    middleware: Abstract<MiddlewareInterface>[];

    add(uri: string, method: Http.Method, controller: typeof Controller, action: string, name: string = action) {
        uri = this.prepareUri(uri);
        this.routes.push(new Route(uri, method, controller, action, name));
    }

    async handle(app: Application, request: Request): Promise<Response> {
        const container = app.createChildContainer();

        container.set(Request, request);

        let stack: RequestHandler = async (request2: Request) => {
            const route = this.getRoute(request2.uri || '', request2.method);
            if (!route) {
                return new Response(Http.Status.NOT_FOUND);
            }
            request2.parameters = route.parameters;

            container.set(Route, route);

            const content = await route.run(request2, container);

            if (content instanceof Response) {
                return content;
            }

            return Response.ok(content);
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
