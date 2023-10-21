import { Response } from './Http'
import { Request } from '@Typetron/Router/Request'

export type RequestHandler = (request: Request) => Promise<Response>

export interface MiddlewareInterface {
    handle(request: Request, next: RequestHandler): Promise<Response>
}
