import { Provider } from '../Provider'
import { Container, Inject } from '../../Container'
import { AppConfig } from '../Config'
import { App, DEDICATED_COMPRESSOR_3KB, WebSocket as uWebSocket } from 'uWebSockets.js'
import { TextDecoder } from 'util'
import { ErrorHandlerInterface, Response } from '../../Router/Http'
import { ActionErrorResponse, Handler, WebSocket } from '../../Router/Websockets'
import { ActionRequest, ActionResponse } from '@Typetron/Router/Websockets'
import { Request } from '@Typetron/Router/Websockets/Request'

enum WebsocketMessageStatus {
    OK = 'OK',
    Error = 'Error',
}

export class WebsocketsProvider extends Provider {

    @Inject()
    appConfig: AppConfig

    @Inject()
    handler: Handler

    @Inject()
    errorHandler: ErrorHandlerInterface

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
                const socketWrapper = new WebSocket(socket, this.app.createChildContainer())
                this.handler.onOpen?.run(socketWrapper.connection.container, {})
            },
            close: async (socket: uWebSocket) => {
                await this.handler.onClose?.run(socket.container, {}).catch(error => {
                    console.log('socket close error  ->', error)
                })
            },

            /* For brevity we skip the other actions (upgrade, open, ping, pong, close) */
            message: async (socket, message, isBinary) => {
                const jsonData = stringDecoder.decode(message)
                let data: ActionRequest
                try {
                    data = JSON.parse(jsonData)
                } catch {
                    throw new Error(`Invalid Websocket message sent: ${jsonData}`)
                }

                try {
                    const response = await this.handleAction(socket.container, data)
                    const action = data.action
                    const sentResponse: ActionResponse<unknown> = {
                        action,
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
                    const errorMessage: ActionErrorResponse = {
                        message: {
                            message: error.content ?? error.message,
                            stack: error.stack.split('\n')
                        },
                        action: data.action,
                        status: WebsocketMessageStatus.Error
                    }
                    if (errorMessage.message) {
                        const response = await this.errorHandler.handle(error) as Response<Error>
                        errorMessage.message.message = response.body.message
                    }
                    socket.send(JSON.stringify(errorMessage), isBinary, true)
                }

            }

        }).listen(port, (listenSocket) => {
            if (listenSocket) {
                console.log(`Websocket server started on port ${port}`)
            }
        })
    }

    private async handleAction(container: Container, {action, message}: ActionRequest) {
        const request = new Request(action, message?.body)

        // TODO find a way to save parameters so they can be retrieved easily in the Resolvers (check routeEntity resolver for example)
        message?.parameters?.forEach(parameter => {
            request.parameters[String.random(15)] = parameter
        })
        return this.handler.handle(container, request)
    }
}
