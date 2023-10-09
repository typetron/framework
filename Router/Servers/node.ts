import { Http, Request, Response } from '@Typetron/Router/Http'
import { createServer, IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http'

export function nodeServer(port: number, handler: (request: Request) => Promise<Response>) {
    const server = createServer(async (incomingMessage: IncomingMessage, serverResponse: ServerResponse) => {
        const request = new Request(
            incomingMessage.url ?? '',
            incomingMessage.method as Http.Method || Http.Method.GET
        )

        request.setHeadersLoader(() => {
            return incomingMessage.headers
        })
        request.getHeader = <T extends string | string[] | undefined>(name: keyof IncomingHttpHeaders | string): T => {
            return incomingMessage.headers[String(name).toLowerCase()] as T
        }

        if (request.method !== Http.Method.GET) {
            if (request.isMultipartRequest()) {
                [request.body, request.files] = await Request.loadMultipartContent(incomingMessage)
            } else {
                request.body = await Request.loadSimpleContent(incomingMessage)
            }

            // const overwrittenMethod = (request.body as Record<string, string | undefined>)[Request.methodField] || ''
            // request.method = Http.Method[overwrittenMethod.toUpperCase() as Http.Method] || request.method
        }


        const response = await handler(request)
        Response.send(serverResponse, response.status, response.body, response.headers)
    })

    server.listen(port)
}
