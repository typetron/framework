// noinspection TypeScriptPreferShortImport
import '../Support/Math';
import { Handler, Http, Request } from '../Http';
import { IncomingHttpHeaders } from 'http';
import { Container } from '../Container';
import { Application } from '../Framework';
import { Router } from '../Router';

export abstract class TestCase {
    app: Container;

    abstract async bootstrapApp(): Promise<void>;

    async before() {
        await this.bootstrapApp();
    }

    get(routeName: string, content = {}, headers: IncomingHttpHeaders = {}) {
        return this.request(Http.Method.GET, routeName, content, headers);
    }

    post(routeName: string, content = {}, headers: IncomingHttpHeaders = {}) {
        return this.request(Http.Method.POST, routeName, content, headers);
    }

    private async request(method: Http.Method, routeName: string, content = {}, headers: IncomingHttpHeaders = {}) {
        const router = this.app.get(Router);
        const route = router.routes.findWhere('name', routeName);
        if (!route) {
            throw new Error(`Route '${routeName}' not found`);
        }

        const request = new Request(route.uri, method, {}, {}, headers, content);
        // const response = new Response();
        // request.method = method;
        // request.url = route.uri;
        // request.headers = headers;

        // const socket = new Socket();
        // const incomingMessage = new IncomingMessage(socket);
        // const request = new Request(incomingMessage);
        // const serverResponse = new ServerResponse(request.incomingMessage);
        // const response = new Response(serverResponse);

        // const oldWrite = response.response.write.bind(response);
        // response.response.write = function (content: string | number) {
        //     response.content = String(content);
        //     return oldWrite(response.content);
        // };

        const response = await this.app.get(Handler).handle(this.app as Application, request);

        if (response.content instanceof Buffer) {
            response.content = response.content.toString();
        }

        return response;

        // return new Promise<Response>(resolve => {
        //     response.response.end = function () {
        //         resolve(response);
        //     };
        //     request.emit('end');
        // }).catch(reject => {
        //     throw new Error(reject);
        // });
    }
}
