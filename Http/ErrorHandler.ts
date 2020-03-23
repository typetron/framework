import { Response } from './Response';
import { ErrorHandlerInterface } from './ErrorHandlerInterface';
import { HttpError } from './Errors/HttpError';
import { Http } from './index';
import { Request } from './Request';

export class ErrorHandler implements ErrorHandlerInterface {
    handle(error: Error, request: Request) {
        let code = Http.Status.BAD_REQUEST, message: string | object | number = '', stack: string[];

        stack = error.stack ? error.stack.replace(/\n|\s{2,}/g, '').split('at ') : [];
        if (error instanceof HttpError) {
            code = error.status;
            message = error.content;
            stack.unshift(`Route: ${request.method} ${request.uri}`);
        } else {
            message = error.message;
        }

        const errorInfo: {message: string | object | number, stack?: string[]} = {
            message, stack
        };

        return new Response(code, errorInfo);
    }
}
