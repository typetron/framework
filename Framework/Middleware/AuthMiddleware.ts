import { Inject, Injectable } from '../../Container'
import { MiddlewareInterface, RequestHandler } from '../../Router'
import { Http, HttpError, Request } from '@Typetron/Web'
import * as jwt from 'jsonwebtoken'
import { Auth } from '../Auth'

@Injectable()
export class AuthMiddleware implements MiddlewareInterface {

    @Inject()
    auth: Auth

    async handle(request: Request, next: RequestHandler) {
        const authHeader = request.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '')
        try {
            await this.auth.verify(token)
            return next(request)
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
                throw new HttpError('Unauthenticated', Http.Status.UNAUTHORIZED)
            }
            throw new HttpError(error.message, Http.Status.BAD_REQUEST)
        }
    }

}
