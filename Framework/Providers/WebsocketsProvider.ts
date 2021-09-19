import { Provider } from '../Provider'
import { Container, Inject } from '../../Container'
import { AppConfig } from '../Config'
import { App, DEDICATED_COMPRESSOR_3KB, WebSocket as uWebSocket } from 'uWebSockets.js'
import { TextDecoder } from 'util'
import { Http, Request } from '../../Router/Http'
import { Handler, WebSocket } from '../../Router/Websockets'
import { EventRequest, EventResponse } from '../../Router/Websockets/types'

enum WebsocketMessageStatus {
    OK = 'OK',
    Error = 'Error',
}

export class WebsocketsProvider extends Provider {

    @Inject()
    appConfig: AppConfig

    @Inject()
    handler: Handler

    sockets = new Map<string | number, WebSocket>()

    register(): void | Promise<void> {
        const port = this.appConfig.websocketsPort

        if (!port) {
            throw new Error('Please define a port for the Websockets server.')
        }

        const stringDecoder = new TextDecoder()

        const app = App().ws('/', {

            /* There are many common helper features */
            idleTimeout: 40,
            maxBackpressure: 1024,
            maxPayloadLength: 1024 * 1000 * 5,
            compression: DEDICATED_COMPRESSOR_3KB,

            open: (socket: uWebSocket) => {
                const socketWrapper = new WebSocket(socket)
                socket.container = this.app.createChildContainer()
                socket.container.set(WebSocket, socketWrapper)
                this.handler.onOpen?.run(socket.container, {})
            },
            close: (socket: uWebSocket) => {
                this.handler.onClose?.run(socket.container, {})
            },

            /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
            message: async (socket, message, isBinary) => {
                const jsonData = stringDecoder.decode(message)
                let data: EventRequest
                try {
                    data = JSON.parse(jsonData)
                } catch {
                    throw new Error(`Invalid Websocket message sent: ${jsonData}`)
                }

                try {
                    const response = await this.handleEvent(socket.container, data)
                    const event = data.event
                    const sentResponse: EventResponse<unknown> = {
                        event,
                        message: response.body,
                        status: WebsocketMessageStatus.OK,
                    }
                    if (response.status >= 200 && response.status <= 399) {
                        sentResponse.status = WebsocketMessageStatus.OK
                    } else {
                        sentResponse.status = WebsocketMessageStatus.Error
                    }

                    socket.send(JSON.stringify(sentResponse), isBinary, true)

                } catch (error) {
                    const errorMessage: EventResponse<unknown> = {
                        message: {
                            message: error.content ?? error.message,
                            stack: error.stack.split('\n')
                        },
                        event: data.event,
                        status: WebsocketMessageStatus.Error
                    }
                    // console.log('error', errorMessage)
                    socket.send(JSON.stringify(errorMessage), isBinary, true)
                }

            }

        }).listen(port, (listenSocket) => {
            if (listenSocket) {
                console.log(`Websocket server started on port ${port}`)
            }
        })
    }

    private async handleEvent(container: Container, {event, message}: EventRequest) {
        const request = new Request(event, Http.Method.GET,
            {},
            {},
            {},
            message?.body as object ?? {}
        )

        // TODO find a way to save parameters so they can be retrieved easily in the Resolvers (check routeEntity resolver for example)
        message?.parameters?.forEach(parameter => {
            request.parameters[String.random(15)] = parameter
        })
        return this.handler.handle(container, request)
    }
}
