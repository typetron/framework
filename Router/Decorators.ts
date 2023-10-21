import { App } from '../Framework'
import { Abstract, Constructor, Type } from '../Support'
import { MiddlewareInterface } from './Middleware'
import { ActionMetadata, ControllerMetadata, ControllerOptions, MethodMetadata, RouteMetadata } from './Metadata'
import { Guard } from './Guard'
import { Handler as HttpHandler, Http, Request as HttpRequest } from './Http'
import { Request } from './Request'
import { Handler as WebsocketsHandler } from './Websockets'
import { WebsocketRoute } from './Websockets/WebsocketRoute'
import { Container } from '@Typetron/Container'

export function Controller(path = '', options?: ControllerOptions) {
    return (target: object) => {
        const metadata = ControllerMetadata.get(target)
        const prefix = options?.prefix || path ? path + '.' : ''

        const httpHandler = Container.getInstance().get(HttpHandler)
        const websocketHandler = Container.getInstance().get(WebsocketsHandler)

        Object.keys(metadata.routes).forEach(action => {
            const routeMetadata = metadata.routes[action]
            const route = httpHandler.addRoute(
                path + (path && routeMetadata.path ? '/' : '') + routeMetadata.path,
                routeMetadata.method,
                target as Constructor,
                action,
                prefix + (routeMetadata.name || action),
                routeMetadata.parametersTypes,
                metadata.middleware.concat(routeMetadata.middleware)
            )
            route.guards = routeMetadata.guards
        })

        Object.keys(metadata.actions).forEach(actionName => {
            const actionMetadata = metadata.actions[actionName]
            const name = prefix + (actionMetadata.name || actionName)
            const action = websocketHandler.addAction(
                name,
                target as Constructor,
                actionName,
                actionMetadata.parametersTypes,
                metadata.middleware.concat(actionMetadata.middleware)
            )
            action.guards = actionMetadata.guards
        })
    }
}

function addAction(controller: Constructor, methodName: string, name: string) {
    const metadata = ControllerMetadata.get(controller)

    const methodMetadata = metadata.methods[methodName]
    const action = new ActionMetadata()
    Object.assign(action, methodMetadata)

    action.parametersTypes = Reflect.getMetadata('design:paramtypes', controller.prototype, methodName)
    action.name = name

    metadata.actions[methodName] = action

    ControllerMetadata.set(metadata, controller)
}

function addRoute(controller: Constructor, methodName: string, method: Http.Method, path: string, name: string) {
    const metadata = ControllerMetadata.get(controller)

    const methodMetadata = metadata.methods[methodName]
    const route = new RouteMetadata()
    Object.assign(route, methodMetadata)

    route.parametersTypes = Reflect.getMetadata('design:paramtypes', controller.prototype, methodName)
    route.path = path
    route.name = name
    route.method = method

    metadata.routes[methodName] = route

    ControllerMetadata.set(metadata, controller)
}

export function Action(name = '') {
    return (target: object, action: string) => {
        addAction(target.constructor as Constructor, action, name)
    }
}

export function OnOpen(target: object, action: string) {
    const websocketHandler = App.get(WebsocketsHandler)

    websocketHandler.onOpen = new WebsocketRoute(
        '',
        target.constructor as Constructor,
        action,
        Reflect.getMetadata('design:paramtypes', target, action),
    )
}

export function OnClose(target: object, action: string) {
    const websocketHandler = App.get(WebsocketsHandler)

    websocketHandler.onClose = new WebsocketRoute(
        '',
        target.constructor as Constructor,
        action,
        Reflect.getMetadata('design:paramtypes', target, action),
    )
}

export function Arg(name: string) {
    return function(target: object, action: string, parameterIndex: number) {
        // addAction(target.constructor as Constructor, action, name)
    }
}

export function Get(path = '', name = '') {
    return (target: object, action: string) => {
        addRoute(target.constructor as Constructor, action, Http.Method.GET, path, name)
    }
}

export function Post(path: string = '', name = '') {
    return (target: object, action: string) => {
        addRoute(target.constructor as Constructor, action, Http.Method.POST, path, name)
    }
}

export function Put(path: string = '', name = '') {
    return (target: object, action: string) => {
        addRoute(target.constructor as Constructor, action, Http.Method.PUT, path, name)
    }
}

export function Patch(path: string = '', name = '') {
    return (target: object, action: string) => {
        addRoute(target.constructor as Constructor, action, Http.Method.PATCH, path, name)
    }
}

export function Delete(path: string = '', name = '') {
    return (target: object, action: string) => {
        addRoute(target.constructor as Constructor, action, Http.Method.DELETE, path, name)
    }
}

export function Middleware(...middleware: Abstract<MiddlewareInterface>[]) {
    return (target: object, action?: string) => {
        if (action) {
            target = target.constructor
        }

        const metadata = ControllerMetadata.get(target)

        if (action) {
            const route = metadata.methods[action] || new MethodMetadata()
            route.middleware = route.middleware.concat(middleware)
            metadata.methods[action] = route
        } else {
            metadata.middleware = metadata.middleware.concat(middleware)
        }

        ControllerMetadata.set(metadata, target)
    }
}

export function AllowIf(...guards: Type<Guard>[]) {
    return function(target: object, action: string) {
        if (action) {
            target = target.constructor
        }

        const metadata = ControllerMetadata.get(target)

        if (action) {
            const route = metadata.methods[action] || new MethodMetadata()
            route.guards = route.guards.concat(guards)
            metadata.methods[action] = route
        } else {
            metadata.guards = metadata.guards.concat(guards)
        }

        ControllerMetadata.set(metadata, target)
    }
}

export function Query(name: string) {
    return function(target: object, action: string, parameterIndex: number) {
        const metadata = ControllerMetadata.get(target.constructor)
        const parametersTypes = Reflect.getMetadata('design:paramtypes', target, action)

        const route = metadata.methods[action] || new MethodMetadata()
        route.parametersOverrides[parameterIndex] = function(container: Container) {
            const request = container.get(HttpRequest)
            const value = request.query[name]

            if (parametersTypes[parameterIndex].name === 'Number') {
                return value === undefined || value === 'undefined' ? undefined : Number(value)
            }
            return value
        }

        metadata.methods[action] = route
        ControllerMetadata.set(metadata, target.constructor)
    }
}

export function Body() {
    return function(target: object, action: string, parameterIndex: number) {
        const metadata = ControllerMetadata.get(target.constructor)
        const route = metadata.methods[action] || new MethodMetadata()
        route.parametersOverrides[parameterIndex] = function(container: Container) {
            const request = container.get(Request)

            // TODO: should the framework throw error or return undefined?
            // if (!request.body) {
            //     throw new Error(`There is no data in the 'body' of the request`)
            // }

            return request.body
        }

        metadata.methods[action] = route
        ControllerMetadata.set(metadata, target.constructor)
    }
}
