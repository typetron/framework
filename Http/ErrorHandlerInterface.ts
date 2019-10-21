import { Response } from './Response';

export class ErrorHandlerInterface {
    handle: (error: Error) => Promise<Response> | Response;
}
