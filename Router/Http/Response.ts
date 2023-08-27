import { OutgoingHttpHeaders, ServerResponse } from 'http'
import { Http } from '.'
import { Buffer } from 'buffer'

type Content = unknown | undefined | number | string | object | Buffer

export class Response<T = unknown> {

    constructor(
        public body: T,
        public status: Http.Status = Http.Status.OK,
        public headers: OutgoingHttpHeaders = {}
    ) {
    }

    static ok(content: string | object) {
        return new Response(content, Http.Status.OK)
    }

    static notFound(content: string | object) {
        return new Response(content, Http.Status.NOT_FOUND)
    }

    static badRequest(content: string | object) {
        return new Response(content, Http.Status.BAD_REQUEST)
    }

    static send(serverResponse: ServerResponse, status: Http.Status, content: Content, headers?: OutgoingHttpHeaders) {
        if (!(content instanceof Buffer)) {
            if (content instanceof Object) {
                content = JSON.stringify(content)
                serverResponse.setHeader('Content-Type', 'application/json')
            }
            content = String(content ?? '')
        }

        for (const header in headers) {
            serverResponse.setHeader(header, headers[header] || '')
        }

        serverResponse.statusCode = status
        serverResponse.end(content)
    }

    setHeader(name: string, value: string) {
        this.headers[name] = value
    }

    setHeaders(headers: OutgoingHttpHeaders) {
        this.headers = headers
    }
}
