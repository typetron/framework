import { Response } from './Http'
import { Request } from '@Typetron/Router/Request'

export type RequestHandler = (request: Request) => Promise<Response>

/**
 * @deprecated Please use the Middleware, HttpMiddleware or WebsocketMiddleware classes instead
 */
export type MiddlewareInterface = {
    handle(request: Request, next: RequestHandler): Promise<Response>
}

export abstract class GlobalMiddleware {
    abstract handle(request: Request, next: RequestHandler): Promise<Response>
}

