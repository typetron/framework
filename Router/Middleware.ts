import { Request, Response } from '../Http'

export type RequestHandler = (request: Request) => Promise<Response>;

export interface MiddlewareInterface {
    handle(request: Request, next: RequestHandler): Promise<Response>;
}
