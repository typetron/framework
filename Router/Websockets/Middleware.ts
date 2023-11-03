import { Request } from '@Typetron/Router/Websockets/Request'
import { GlobalMiddleware, RequestHandler } from '@Typetron/Router'
import { Response } from '@Typetron/Router/Http' // TODO remove any Http reference from websockets

export abstract class WebsocketMiddleware extends GlobalMiddleware {
    abstract handle(request: Request, next: RequestHandler): Promise<Response>
}
