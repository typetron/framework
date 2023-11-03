import { OutgoingHttpHeaders } from 'http'
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

    setHeader(name: string, value: string) {
        this.headers[name] = value
    }

    setHeaders(headers: OutgoingHttpHeaders) {
        this.headers = headers
    }
}
