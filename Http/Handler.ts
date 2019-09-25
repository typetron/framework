import { Inject } from '../Container';
import { HttpError, Router } from '../Router';
import { Http } from './index';
import { Request } from './Request';
import { Response } from './Response';
import { Application } from '../Framework';

export class Handler {
    @Inject()
    router: Router;

    async handle(app: Application, request: Request) {
        try {
            return await this.router.handle(app, request);
        } catch (error) {
            return this.handleError(error);
        }
    }

    private handleError(error: Error | HttpError | string) {
        let code = Http.Status.BAD_REQUEST, message: string | object | number = '', stack: string[] = [];

        if (error instanceof Error) {
            if (error instanceof HttpError) {
                code = error.status;
                message = error.getMessage();
            } else {
                message = error.message;
            }
            stack = error.stack ? error.stack.replace(/\n|\s{2,}/g, '').split('at ') : [];
        } else {
            message = String(error);
        }
        const errorInfo: {message: string | object | number, stack?: string[]} = {
            message, stack
        };

        return new Response(code, {}, errorInfo);
    }
}
