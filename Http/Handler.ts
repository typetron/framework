import { Inject } from '../Container';
import { Router } from '../Router';
import { ErrorHandlerInterface, Response } from './index';
import { Request } from './Request';
import { AppConfig, Application } from '../Framework';
import { createServer, IncomingMessage, ServerResponse } from 'http';

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

    startServer(app: Application): void {

        const config = app.config.get(AppConfig);

        const server = createServer(async (incomingMessage: IncomingMessage, serverResponse: ServerResponse) => {
            try {
                const request = await Request.capture(incomingMessage);
                const response = await this.handle(app, request);
                Response.send(response, serverResponse);
            } catch (error) {
                Response.send(await this.errorHandler.handle(error), serverResponse);
            }
        });

        server.listen(config.port);

    }
}
