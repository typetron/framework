import { OutgoingHttpHeaders, ServerResponse } from 'http';
import { Http } from '.';

export class Response {

    constructor(
        public status: Http.Status = Http.Status.OK,
        public content?: string | object,
        public headers: OutgoingHttpHeaders = {}
    ) {
    }

    static ok(content: string | object) {
        return new Response(Http.Status.OK, content);
    }

    static notFound(content: string | object) {
        return new Response(Http.Status.NOT_FOUND, content);
    }

    static badRequest(content: string | object) {
        return new Response(Http.Status.BAD_REQUEST, content);
    }

    setHeader(name: string, value: string) {
        this.headers[name] = value;
    }

    setHeaders(headers: OutgoingHttpHeaders) {
        this.headers = headers;
    }

    static send(response: Response, serverResponse: ServerResponse) {
        let content = response.content;
        let rawContent: String | Buffer | undefined;
        if (!(content instanceof Buffer)) {
            if (content instanceof Object) {
                content = JSON.stringify(content);
                response.headers['Content-Type'] = 'application/json';
            }
            rawContent = String(content);
        } else {
            rawContent = content;
        }

        for (const header in response.headers) {
            serverResponse.setHeader(header, response.headers[header] || '');
        }

        serverResponse.statusCode = response.status;
        serverResponse.end(rawContent);
    }
}
