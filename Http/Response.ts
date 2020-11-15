import { OutgoingHttpHeaders, ServerResponse } from 'http'
import { Http } from '.'

export class Response<T = string | object | undefined> {

    constructor(
        public status: Http.Status = Http.Status.OK,
        public content?: T,
        public headers: OutgoingHttpHeaders = {
            'Content-Type': 'text/html'
        }
    ) {
    }

    static ok(content: string | object) {
        return new Response(Http.Status.OK, content)
    }

    static notFound(content: string | object) {
        return new Response(Http.Status.NOT_FOUND, content)
    }

    static badRequest(content: string | object) {
        return new Response(Http.Status.BAD_REQUEST, content)
    }

    static send(response: Response, serverResponse: ServerResponse) {
        let content = response.content ?? ''
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
