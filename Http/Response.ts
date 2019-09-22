import { OutgoingHttpHeaders, ServerResponse } from 'http';
import { Http } from '.';

export class Response {
    constructor(
        public status: Http.Status = Http.Status.OK,
        public headers: OutgoingHttpHeaders = {},
        public content?: string | object
    ) {
    }

    static send(response: Response, serverResponse: ServerResponse) {
        let content = response.content;
        let rawContent: string | Buffer;
        if (!(content instanceof Buffer)) {
            if (content instanceof Object) {
                const contentType = 'application/json';
                content = JSON.stringify(content, (key, value) => {
                    if (value && typeof value === 'object' && typeof value['toObject'] === 'function') {
                        return value.toObject();
                    }
                    return value;
                });
                response.headers['Content-Type'] = contentType;
            }
            rawContent = String(content || '');
        } else {
            rawContent = content;
        }

        Object.keys(response.headers).forEach((header) => {
            const value = response.headers[header] as string;
            serverResponse.setHeader(header, value);
        });

        serverResponse.statusCode = response.status;
        serverResponse.end(rawContent);
    }
}
