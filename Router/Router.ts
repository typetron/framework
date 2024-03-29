import { Container, Inject } from '../Container'
import { Storage } from '../Storage'
import { Abstract } from '../Support'
import { GlobalMiddleware } from './Middleware'
import { WebsocketRoute } from './Websockets/WebsocketRoute'
import { HttpRoute } from '@Typetron/Router/Http/HttpRoute'
import { HttpMiddleware } from '@Typetron/Router/Http/Middleware'
import { WebsocketMiddleware } from '@Typetron/Router/Websockets/Middleware'

export class Router {

    @Inject()
    app: Container

    routes: HttpRoute[] = []
    actions = new Map<string, WebsocketRoute>()

    middleware: {
        global: Abstract<GlobalMiddleware>[],
        http: Abstract<HttpMiddleware>[],
        websocket: Abstract<WebsocketMiddleware>[],
    } = {
        global: [],
        http: [],
        websocket: [],
    }

    public loadControllers(directory: string) {
        this.app.get(Storage)
            .files(directory, true)
            .whereIn('extension', ['ts'])
            .forEach(file => require(file.path))
    }

}
