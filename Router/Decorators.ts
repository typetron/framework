import { App } from '../Framework'
import { Router } from './Router'
import { Abstract, Constructor, Type } from '../Support'
import { Http, Request } from '../Http'
import { MiddlewareInterface } from './Middleware'
import { ControllerMetadata, RouteMetadata } from './Metadata'
import { Guard } from './Guard'

class ControllerOptions {
    prefix?: string
}

export function Controller(path = '', options = new ControllerOptions) {
    return (target: Object) => {
        const metadata = ControllerMetadata.get(target)
        const prefix = options.prefix || path ? path + '.' : ''

        const router = App.get(Router)

        Object.keys(metadata.routes).forEach(action => {
            const routeMetadata = metadata.routes[action]
            const route = router.add(
                path + (path && routeMetadata.path ? '/' : '') + routeMetadata.path,
                routeMetadata.method,
                target as Constructor,
                action,
                prefix + (routeMetadata.name || action),
                routeMetadata.parametersTypes,
                metadata.middleware.concat(routeMetadata.middleware)
            );
            route.guards = routeMetadata.guards;
        });
    };
}

function addRoute(controller: Constructor, action: string, method: Http.Method, path: string, name: string) {
    const metadata = ControllerMetadata.get(controller);

    const route = metadata.routes[action] || new RouteMetadata;
    route.parametersTypes = Reflect.getMetadata('design:paramtypes', controller.prototype, action);
    route.path = path;
    route.name = name;
    route.method = method;

    metadata.routes[action] = route;

    ControllerMetadata.set(metadata, controller);
}

export function Get(path = '', name = '') {
    return (target: Object, action: string) => {
        addRoute(target.constructor as Constructor, action, Http.Method.GET, path, name);
    };
}

export function Post(path: string = '', name = '') {
    return (target: Object, action: string) => {
        addRoute(target.constructor as Constructor, action, Http.Method.POST, path, name);
    };
}

export function Put(path: string = '', name = '') {
    return (target: Object, action: string) => {
        addRoute(target.constructor as Constructor, action, Http.Method.PUT, path, name);
    };
}

export function Patch(path: string = '', name = '') {
    return (target: Object, action: string) => {
        addRoute(target.constructor as Constructor, action, Http.Method.PATCH, path, name);
    };
}

export function Delete(path: string = '', name = '') {
    return (target: Object, action: string) => {
        addRoute(target.constructor as Constructor, action, Http.Method.DELETE, path, name);
    };
}

export function Middleware(...middleware: Abstract<MiddlewareInterface>[]) {
    return (target: Object, action?: string) => {
        if (action) {
            target = target.constructor;
        }

        const metadata = ControllerMetadata.get(target);

        if (action) {
            const route = metadata.routes[action] || new RouteMetadata;
            route.middleware = route.middleware.concat(middleware);
            metadata.routes[action] = route;
        } else {
            metadata.middleware = metadata.middleware.concat(middleware);
        }

        ControllerMetadata.set(metadata, target);
    };
}

export function AllowIf(...guards: Type<Guard>[]) {
    return function (target: object, action: string) {
        if (action) {
            target = target.constructor;
        }

        const metadata = ControllerMetadata.get(target);

        if (action) {
            const route = metadata.routes[action] || new RouteMetadata;
            route.guards = route.guards.concat(guards);
            metadata.routes[action] = route;
        } else {
            metadata.guards = metadata.guards.concat(guards);
        }

        ControllerMetadata.set(metadata, target);
    };
}

export function Query(name: string) {
    return function (target: Object, action: string, parameterIndex: number) {
        const metadata = ControllerMetadata.get(target.constructor)
        const parametersTypes = Reflect.getMetadata('design:paramtypes', target, action)

        const route = metadata.routes[action] || new RouteMetadata()
        route.parametersOverrides[parameterIndex] = function (request: Request) {
            const value = request.query[name]

            if (parametersTypes[parameterIndex].name === 'Number') {
                return value === undefined || value === 'undefined' ? undefined : Number(value)
            }
            return value
        }

        metadata.routes[action] = route;
        ControllerMetadata.set(metadata, target.constructor);
    };
}
