import { Container, Inject } from '../Container'
import { Storage } from '../Storage'
import { Abstract } from '../Support'
import { MiddlewareInterface } from './Middleware'
import { WebsocketRoute } from './Websockets/WebsocketRoute'
import { HttpRoute } from '@Typetron/Router/Http/HttpRoute'

export class Router {

    @Inject()
    app: Container

    routes: HttpRoute[] = []
    actions = new Map<string, WebsocketRoute>()

    middleware: Abstract<MiddlewareInterface>[] = []

    public loadControllers(directory: string) {
        this.app.get(Storage)
            .files(directory, true)
            .whereIn('extension', ['ts'])
            .forEach(file => require(file.path))
    }

}
