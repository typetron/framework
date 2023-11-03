import { Request } from '@Typetron/Router/Request'
import { Response } from '.'
import { GlobalMiddleware, RequestHandler } from '..'

export abstract class HttpMiddleware extends GlobalMiddleware {
    abstract handle(request: Request, next: RequestHandler): Promise<Response>
}
