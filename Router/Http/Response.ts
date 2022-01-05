import { OutgoingHttpHeaders, ServerResponse } from 'http'
import { Http } from '.'
import { Buffer } from 'buffer'

// tslint:disable-next-line:no-any
export class Response<T = any> {

    constructor(
        public body: T,
        public status: Http.Status = Http.Status.OK,
        public headers: OutgoingHttpHeaders = {
            'Content-Type': 'text/html'
        }
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

    static send(response: Response<undefined | number | string | object | Buffer>, serverResponse: ServerResponse) {
        const content = this.getContent(response)

        for (const header in response.headers) {
            serverResponse.setHeader(header, response.headers[header] || '')
        }

        serverResponse.statusCode = response.status
        serverResponse.end(content)
    }

    static getContent(response: Response<number | string | object | undefined>) {
        let content = response.body ?? ''
        if (!(content instanceof Buffer)) {
            if (content instanceof Object) {
                content = JSON.stringify(content)
                response.headers['Content-Type'] = 'application/json'
            }
            return content.toString()
        }
        return content
    }

    setHeader(name: string, value: string) {
        this.headers[name] = value
    }

    setHeaders(headers: OutgoingHttpHeaders) {
        this.headers = headers
    }
}
