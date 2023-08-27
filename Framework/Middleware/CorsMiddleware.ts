import { Inject, Injectable } from '../../Container'
import { MiddlewareInterface, RequestHandler } from '../../Router'
import { ErrorHandlerInterface, Request, Response } from '../../Router/Http'

@Injectable()
export class CorsMiddleware implements MiddlewareInterface {

    @Inject()
    errorHandler: ErrorHandlerInterface

    async handle(request: Request, next: RequestHandler) {
        let response: Response
        if (request.method === 'OPTIONS') {
            response = new Response(undefined)
            response.setHeaders({
                'Access-Control-Allow-Methods': 'GET, PUT, PATCH, POST, DELETE',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            })
        } else {
            try {
                response = await next(request)
            } catch (error) {
                response = await this.errorHandler.handle(error, request)
            }
        }

        response.setHeader('Access-Control-Allow-Origin', '*')
        return response
    }

}
