import { Response } from './Response'
import { Request } from './Request'

export class ErrorHandlerInterface {
    handle: (error: Error, request?: Request) => Promise<Response> | Response
}
