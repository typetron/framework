import { OutgoingHttpHeaders, ServerResponse } from 'http'
import { Http } from '.'
import { Buffer } from 'buffer'

export class Response<T = string | object | undefined> {

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
        let content = response.body ?? ''
        let rawContent: String | Buffer | undefined
        if (!(content instanceof Buffer)) {
            if (content instanceof Object) {
                content = JSON.stringify(content)
                response.headers['Content-Type'] = 'application/json'
            }
            rawContent = content.toString()
        } else {
            rawContent = content
        }

        for (const header in response.headers) {
            serverResponse.setHeader(header, response.headers[header] || '')
        }

        serverResponse.statusCode = response.status
        serverResponse.end(rawContent)
    }

    setHeader(name: string, value: string) {
        this.headers[name] = value
    }

    setHeaders(headers: OutgoingHttpHeaders) {
        this.headers = headers
    }
}
