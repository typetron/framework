import { Response } from './Response';
import { ErrorHandlerInterface } from './ErrorHandlerInterface';
import { HttpError } from './Errors/HttpError';
import { Http } from './index';

export class ErrorHandler implements ErrorHandlerInterface {
    handle(error: Error) {
        let code = Http.Status.BAD_REQUEST, message: string | object | number = '', stack: string[];

        if (error instanceof HttpError) {
            code = error.status;
            message = error.content;
        } else {
            message = error.message;
        }
        stack = error.stack ? error.stack.replace(/\n|\s{2,}/g, '').split('at ') : [];

        const errorInfo: {message: string | object | number, stack?: string[]} = {
            message, stack
        };

        return new Response(code, errorInfo);
    }
}
