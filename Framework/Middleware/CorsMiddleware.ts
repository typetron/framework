import { Injectable } from '../../Container';
import { MiddlewareInterface, RequestHandler } from '../../Router';
import { Request, Response } from '../../Http';

@Injectable()
export class CorsMiddleware implements MiddlewareInterface {

    async handle(request: Request, next: RequestHandler) {
        let response: Response;
        if (request.method === 'OPTIONS') {
            response = new Response;
            response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE';
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type';
        } else {
            response = await next(request);
        }

        response.headers['Access-Control-Allow-Origin'] = '*';
        return response;
    }

}
