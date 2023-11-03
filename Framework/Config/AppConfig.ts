import { BaseConfig } from './BaseConfig'
import { GlobalMiddleware } from '../../Router'
import { Abstract, Type } from '../../Support'
import { Provider } from '../Provider'
import { HttpMiddleware } from '@Typetron/Router/Http/Middleware'
import { WebsocketMiddleware } from '@Typetron/Router/Websockets/Middleware'

export class AppConfig extends BaseConfig<AppConfig> {
    environment: string
    server: 'node' | 'uNetworking' = 'node'
    debug = true
    port: number
    websocketsPort?: number
    middleware: {
        global: Abstract<GlobalMiddleware>[],
        http: Abstract<HttpMiddleware>[],
        websocket: Abstract<WebsocketMiddleware>[],
    } = {
        global: [],
        http: [],
        websocket: [],
    }
    providers: Type<Provider> []
    staticAssets?: {url: string, path: string, basePath?: boolean, indexFile?: string}[]
}
