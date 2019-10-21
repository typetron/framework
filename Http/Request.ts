import { IncomingHttpHeaders, IncomingMessage } from 'http';
import * as Url from 'url';
import { Http } from '.';
import { Parameters } from './Contracts';
import { ParsedUrlQuery } from 'querystring';

export class Request {
    public parameters: {[key: string]: string} = {};

    constructor(public uri: string,
        public method: Http.Method,
        public query: ParsedUrlQuery = {},
        public cookies: Parameters = {},
        public headers: IncomingHttpHeaders = {},
        public content: string | object = {}) {
    }

    // get headers() {
    //     return this.request.headers;
    // }
    //
    // get url(): string {
    //     return this.request.url || '';
    // }
    //
    // set url(url: string) {
    //     this.request.url = url;
    // }
    //
    // get method(): Http.Method {
    //     return this.request.method as Http.Method;
    // }
    //
    // set method(method: Http.Method) {
    //     this.request.method = method;
    // }

    // emit(event: string) {
    //     this.request.emit(event);
    // }

    static async loadContent(incomingMessage: IncomingMessage): Promise<string | object | undefined> {
        let rawData = '';
        incomingMessage.on('data', chunk => {
            rawData += chunk;
        });

        return new Promise((resolve, reject) => {
            incomingMessage.on('end', async () => {
                if (!rawData) {
                    return resolve(undefined);
                }
                try {
                    resolve(JSON.parse(rawData));
                } catch (e) {
                    resolve(rawData ? rawData : undefined);
                }
            });
        });
    }

    static async capture(message: IncomingMessage): Promise<Request> {
        const url = Url.parse(message.url || '', true);

        return new this(
            url.pathname || '',
            message.method as Http.Method || Http.Method.GET,
            url.query,
            {}, // message.headers.cookie.split(';')
            message.headers || {},
            message.method === Http.Method.GET ? undefined : await Request.loadContent(message)
        );
    }

}
