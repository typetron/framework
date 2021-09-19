import { Container, Inject } from '../Container'
import { Storage } from '../Storage'
import { Abstract } from '../Support'
import { MiddlewareInterface } from './Middleware'
import { Route } from './Route'
import { WebsocketEvent } from './Websockets/WebsocketEvent'

export class Router {

    @Inject()
    app: Container

    routes: Route[] = []
    events = new Map<string, WebsocketEvent>()

    middleware: Abstract<MiddlewareInterface>[] = []

    public loadControllers(directory: string) {
        this.app.get(Storage)
            .files(directory, true)
            .whereIn('extension', ['ts'])
            .forEach(file => require(file.path))
    }

}
