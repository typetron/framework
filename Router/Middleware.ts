import { Request, Response } from '../Http';

export type RequestHandler = (request: Request) => Response | Promise<Response>;

export interface MiddlewareInterface {
    handle(request: Request, next: RequestHandler): Response | Promise<Response>;
}
