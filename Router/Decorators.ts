import { App } from '../Framework';
import { Router } from './Router';
import { Abstract, Type } from '../Support';
import { Controller as BaseController } from './Controller';
import { Http, Request } from '../Http';
import { MiddlewareInterface } from './Middleware';
import { ControllerMetadata, RouteMetadata } from './Metadata';

class ControllerOptions {
    path?: string;
    prefix?: string;
    middleware?: MiddlewareInterface[] = [];
}

export enum Metadata {
    Controller
}

export function Controller(path = '', options = new ControllerOptions) {
    return (target: Object) => {
        const metadata = ControllerMetadata.get(target);
        const prefix = options.prefix || path ? path + '.' : '';

        const router = App.get(Router);

        Object.keys(metadata.routes).forEach(action => {
            const route = metadata.routes[action];
            router.add(
                path + (path && route.path ? '/' : '') + route.path,
                route.method,
                target as Type<BaseController>,
                action,
                prefix + (route.name || action),
                metadata.middleware.concat(route.middleware)
            );
        });
    };
}

function addRoute(controller: typeof BaseController, action: string, method: Http.Method, path: string, name: string) {
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
    return (target: Object, action: string, descriptor: PropertyDescriptor) => {
        addRoute(target.constructor as typeof BaseController, action, Http.Method.GET, path, name);
    };
}

export function Post(path: string = '', name = '') {
    return (target: Object, action: string, descriptor: PropertyDescriptor) => {
        addRoute(target.constructor as typeof BaseController, action, Http.Method.POST, path, name);
    };
}

export function Put(path: string = '', name = '') {
    return (target: Object, action: string, descriptor: PropertyDescriptor) => {
        addRoute(target.constructor as typeof BaseController, action, Http.Method.PUT, path, name);
    };
}

export function Delete(path: string = '', name = '') {
    return (target: Object, action: string, descriptor: PropertyDescriptor) => {
        addRoute(target.constructor as typeof BaseController, action, Http.Method.DELETE, path, name);
    };
}

export function Middleware(...middleware: Abstract<MiddlewareInterface>[]) {
    return (target: Object, action?: string, descriptor?: PropertyDescriptor) => {
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

export function Query(newParameterKey: string) {
    return function (target: Object, action: string, parameterIndex: number) {
        const metadata = ControllerMetadata.get(target.constructor);

        const route = metadata.routes[action] || new RouteMetadata();
        route.parametersOverrides[parameterIndex] = function (request: Request) {
            return request.query[newParameterKey];
        };

        metadata.routes[action] = route;
        ControllerMetadata.set(metadata, target.constructor);
    };
}
