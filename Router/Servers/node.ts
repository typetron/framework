import { Request, Response } from '@Typetron/Router/Http'
import { createServer, IncomingMessage, ServerResponse } from 'http'

export function nodeServer(port: number, handler: (request: Request) => Promise<Response>) {
    const server = createServer(async (incomingMessage: IncomingMessage, serverResponse: ServerResponse) => {
        const request = await Request.capture(incomingMessage)
        const response = await handler(request)
        Response.send(serverResponse, response.status, response.body, response.headers)
    })

    server.listen(port)
}
