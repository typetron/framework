import { App } from '../Framework';
import { Router } from './Router';
import { Type } from '../Support';
import { Controller as BaseController } from './Controller';
import { Http, Request } from '../Http';
import { Middleware } from './Middleware';
import { InjectableMetadata } from '../Container';

class ControllerOptions {
    path?: string;
    prefix?: string;
    middleware?: Middleware[] = [];
}

export enum Metadata {
    Controller
}

export function Permission(...permissions: string[]) {
    return (target: Object, key: string, descriptor: PropertyDescriptor) => {
    };
}

export function Controller(path = '', options = new ControllerOptions) {
    return (target: Object) => {
        // console.log("target ->", path, target);
        options.prefix = options.prefix || path ? path + '.' : '';
        options.path = path;

        const router = App.get(Router);
        router.routes
            .where('controller', target as Type<BaseController>)
            .forEach(route => {
                route.uri = path + (path && route.uri ? '/' : '') + route.uri;
                route.name = options.prefix + route.name;
                route.setUriParts();
                // const uriParts = route.uri.split('/');
                //
                // let routeGroup = router.routesMap[route.method];
                // let i;
                // for (i = 0; i < uriParts.length - 1; ++i) {
                //     if (routeGroup[uriParts[i]]) {
                //         if (routeGroup[uriParts[i]] instanceof Route) {
                //             routeGroup = routeGroup[uriParts[i]] = {'': routeGroup[uriParts[i]]};
                //         } else {
                //             routeGroup = routeGroup[uriParts[i]];
                //         }
                //         continue;
                //     }
                //     routeGroup = routeGroup[uriParts[i]] = {};
                // }
                // routeGroup[uriParts[i]] = route;
            });

        Reflect.defineMetadata(Metadata.Controller, options, target);
    };
}

export function Get(path = '', name?: string) {
    return (target: Object, action: string, descriptor: PropertyDescriptor) => {
        App.get(Router).add(path, Http.Method.GET, target.constructor as typeof BaseController, action, name);
    };
}

export function Post(path: string = '', name?: string) {
    return (target: Object, action: string, descriptor: PropertyDescriptor) => {
        App.get(Router).add(path, Http.Method.POST, target.constructor as typeof BaseController, action, name);
    };
}

export function Put(path: string = '', name?: string) {
    return (target: Object, action: string, descriptor: PropertyDescriptor) => {
        App.get(Router).add(path, Http.Method.PUT, target.constructor as typeof BaseController, action, name);
    };
}

export function Query(newParameterKey: string) {
    return function (target: Object, originalParameterKey: string, parameterIndex: number) {
        const metadata = Reflect.getMetadata(InjectableMetadata.KEY, target, originalParameterKey) || InjectableMetadata.DEFAULT();

        metadata[parameterIndex] = function (request: Request) {
            return request.query[newParameterKey];
        };

        Reflect.defineMetadata(InjectableMetadata.KEY, metadata, target, originalParameterKey);
    };
}
