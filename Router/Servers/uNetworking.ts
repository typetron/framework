import { SSLApp } from 'uWebSockets.js'
import { Http, Request, Response } from '@Typetron/Router/Http'

export function uNetworkingServer(port: number, handler: (request: Request) => Promise<Response>) {
    const app = SSLApp({
        // key_file_name: 'misc/key.pem',
        // cert_file_name: 'misc/cert.pem',
        // passphrase: '1234'
    })
        .any('*', async (response, request) => {
            const appRequest = new Request(request.getUrl(), request.getMethod() as Http.Method, {})
            const appResponse = await handler(appRequest)
            Object.keys(appResponse.headers).forEach(header => {
                const headerValue = appResponse.headers[header]
                if (headerValue) {
                    response.writeHeader(header, String(headerValue))
                }
            })
            response.writeStatus(appResponse.status.toString()).end(String(appResponse.body))
        })
        .listen(port, (token) => {
            if (token) {
                console.log('Listening to port ' + port)
            } else {
                console.log('Failed to listen to port ' + port)
            }
        })
}
