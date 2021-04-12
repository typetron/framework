import { Response } from './Response'
import { ErrorHandlerInterface } from './ErrorHandlerInterface'
import { HttpError } from './Errors/HttpError'
import { Http } from './index'
import { Request } from './Request'
import { Inject } from '../Container'
import { AppConfig } from '../Framework/Config'

export class ErrorHandler implements ErrorHandlerInterface {

    @Inject()
    appConfig: AppConfig

    handle(error: Error, request?: Request) {
        if (this.appConfig.environment === 'production') {
            if (error instanceof HttpError) {
                return new Response(error.content, error.status)
            }
            return new Response(error.message, Http.Status.BAD_REQUEST)
        }

        return this.handleDevelopmentError(error, request)
    }

    private handleDevelopmentError(error: Error, request?: Request) {
        let code = Http.Status.BAD_REQUEST, message: string | object | number = '', stack: string[]

        stack = error.stack ? error.stack.replace(/\n|\s{2,}/g, '').split('at ') : []
        if (error instanceof HttpError) {
            code = error.status
            message = error.content
            if (request) {
                stack.unshift(`Route: ${request.method} ${request.uri}`)
            }
        } else {
            message = error.message
        }

        const errorInfo: {message: string | object | number, stack?: string[]} = {
            message, stack
        }

        return new Response(errorInfo, code)
    }
}
