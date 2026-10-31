import { TemplatedApp } from 'uWebSockets.js'
import { ActionResponse, WebsocketMessageStatus } from './types'

/**
 * Publishes to a topic without going through a connection, so work that outlives
 * the connection that started it can still reach subscribers. Every subscriber
 * receives the message.
 */
export class WebSocketServer {

    constructor(private readonly app: TemplatedApp) {}

    publish(topic: string, action: string, body?: unknown) {
        const sentResponse: ActionResponse<unknown> = {
            action,
            message: body,
            status: WebsocketMessageStatus.OK,
        }
        this.app.publish(topic, JSON.stringify(sentResponse), false, true)
    }
}
