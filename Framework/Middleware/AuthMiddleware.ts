import { Inject, Injectable } from '../../Container'
import { RequestHandler } from '../../Router'
import { Http, HttpError, Request } from '../../Router/Http'
import * as jwt from 'jsonwebtoken'
import { Auth } from '../Auth'
import { HttpMiddleware } from '@Typetron/Router/Http/Middleware'

@Injectable()
export class AuthMiddleware implements HttpMiddleware {

    @Inject()
    auth: Auth

    async handle(request: Request, next: RequestHandler) {
        if (this.auth.identifier && this.auth.expiresAt > new Date()) {
            return next(request)
        }
        const authHeader = request.headers.authorization || (request.body as Record<string, string>)?.token || ''
        const token = authHeader.replace('Bearer ', '')
        try {
            await this.auth.verify(token)
            return next(request)
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
                throw new HttpError('Unauthenticated', Http.Status.UNAUTHORIZED)
            }
            throw new HttpError((error as Error).message, Http.Status.BAD_REQUEST)
        }
    }

}
