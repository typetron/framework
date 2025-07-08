import { Inject, Injectable } from '../../Container'
import { RequestHandler } from '../../Router'
import { ErrorHandlerInterface, Request, Response } from '../../Router/Http'
import { HttpMiddleware } from '@Typetron/Router/Http/Middleware'

@Injectable()
export class CorsMiddleware extends HttpMiddleware {

    @Inject()
    errorHandler: ErrorHandlerInterface

    async handle(request: Request, next: RequestHandler) {
        let response: Response
        if (request.method.toLowerCase() === 'options') {
            response = new Response(undefined)
            response.setHeaders({
                'Access-Control-Allow-Methods': 'GET, PUT, PATCH, POST, DELETE',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            })
        } else {
            try {
                response = await next(request)
            } catch (error) {
                response = await this.errorHandler.handle(error as Error, request)
            }
        }

        response.setHeader('Access-Control-Allow-Origin', '*')
        return response
    }

}
