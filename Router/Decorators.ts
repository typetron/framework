import { App, Application } from '../Framework'
import { Abstract, Constructor, Type } from '../Support'
import { MiddlewareInterface } from './Middleware'
import { ControllerMetadata, EventMetadata, RouteMetadata } from './Metadata'
import { Guard } from './Guard'
import { Handler as HttpHandler, Http, Request } from './Http'
import { Handler as WebsocketsHandler } from './Websockets'
import { WebsocketEvent } from './Websockets/WebsocketEvent'

class ControllerOptions {
    prefix?: string
}

export function Controller(path = '', options = new ControllerOptions) {
    return (target: object) => {
        const metadata = ControllerMetadata.get(target)
        const prefix = options.prefix || path ? path + '.' : ''

        const httpHandler = App.get(HttpHandler)
        const websocketHandler = App.get(WebsocketsHandler)

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

        Object.keys(metadata.events).forEach(action => {
            const eventMetadata = metadata.events[action]
            const name = prefix + (eventMetadata.name || action)
            const event = websocketHandler.addEvent(
                name,
                target as Constructor,
                action,
                eventMetadata.parametersTypes,
                metadata.middleware.concat(eventMetadata.middleware)
            )
            event.guards = eventMetadata.guards
        })
    }
}

function addEvent(controller: Constructor, action: string, name: string) {
    const metadata = ControllerMetadata.get(controller)

    const event = metadata.events[action] || new EventMetadata
    event.parametersTypes = Reflect.getMetadata('design:paramtypes', controller.prototype, action)
    event.name = name

    metadata.events[action] = event

    ControllerMetadata.set(metadata, controller)
}

function addRoute(controller: Constructor, action: string, method: Http.Method, path: string, name: string) {
    const metadata = ControllerMetadata.get(controller)

    const route = metadata.routes[action] || new RouteMetadata
    route.parametersTypes = Reflect.getMetadata('design:paramtypes', controller.prototype, action)
    route.path = path
    route.name = name
    route.method = method

    metadata.routes[action] = route

    ControllerMetadata.set(metadata, controller)
}

export function Event(name = '') {
    return (target: object, action: string) => {
        addEvent(target.constructor as Constructor, action, name)
    }
}

export function OnOpen(target: object, action: string) {
    const websocketHandler = App.get(WebsocketsHandler)

    websocketHandler.onOpen = new WebsocketEvent(
        '',
        target.constructor as Constructor,
        action,
        Reflect.getMetadata('design:paramtypes', target, action),
    )
}

export function OnClose(target: object, action: string) {
    const websocketHandler = App.get(WebsocketsHandler)

    websocketHandler.onClose = new WebsocketEvent(
        '',
        target.constructor as Constructor,
        action,
        Reflect.getMetadata('design:paramtypes', target, action),
    )
}

export function Arg(name: string) {
    return function(target: object, action: string, parameterIndex: number) {
        // addEvent(target.constructor as Constructor, action, name)
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
            const route = metadata.routes[action] || new RouteMetadata
            route.middleware = route.middleware.concat(middleware)
            metadata.routes[action] = route
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
            const route = metadata.routes[action] || new RouteMetadata
            route.guards = route.guards.concat(guards)
            metadata.routes[action] = route
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

        const route = metadata.routes[action] || new RouteMetadata()
        route.parametersOverrides[parameterIndex] = function(container: Application) {
            const request = container.get(Request)
            const value = request.query[name]

            if (parametersTypes[parameterIndex].name === 'Number') {
                return value === undefined || value === 'undefined' ? undefined : Number(value)
            }
            return value
        }

        metadata.routes[action] = route
        ControllerMetadata.set(metadata, target.constructor)
    }
}

export function Body() {
    return function(target: object, action: string, parameterIndex: number) {
        const metadata = ControllerMetadata.get(target.constructor)

        const route = metadata.events[action] || new RouteMetadata()
        route.parametersOverrides[parameterIndex] = function(container: Application) {
            const request = container.get(Request)

            if (!request.body) {
                throw new Error(`There is no data in the 'body' of the request`)
            }

            return request.body
        }

        metadata.events[action] = route
        ControllerMetadata.set(metadata, target.constructor)
    }
}
