import { Inject } from '../Container';
import { Router } from '../Router';
import { ErrorHandlerInterface } from './index';
import { Request } from './Request';
import { Application } from '../Framework';

export class Handler {
    @Inject()
    router: Router;

    @Inject()
    errorHandler: ErrorHandlerInterface;

    async handle(app: Application, request: Request) {
        try {
            return await this.router.handle(app, request);
        } catch (error) {
            return this.errorHandler.handle(error, request);
        }
    }
}
