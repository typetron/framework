import { WebSocket as uWebSocket } from 'uWebSockets.js'
import { ActionResponse, WebsocketMessageStatus } from './types'
import { Container } from '@Typetron/Container'

export * from './Handler'
export * from './types'

export class WebSocket {

    id?: number | string

    constructor(public connection: uWebSocket, public container: Container) {
        this.reset(container)
    }

    subscribe(topic: string) {
        this.connection.subscribe(topic)
    }

    unsubscribe(topic: string) {
        this.connection.unsubscribe(topic)
    }

    reset(container?: Container) {
        this.connection.container = container || this.connection.container.parent.createChildContainer()
        this.connection.container.set(WebSocket, this)
    }

    // tslint:disable-next-line:no-any
    publish(topic: string, action: string, body?: unknown) {
        const sentResponse: ActionResponse<unknown> = {
            action,
            message: body,
            status: WebsocketMessageStatus.OK,
        }
        this.connection.publish(topic, JSON.stringify(sentResponse), false, true)
    }

    // tslint:disable-next-line:no-any
    publishAndSend(topic: string, action: string, body?: unknown) {
        this.publish(topic, action, body)
        this.send(action, body)
    }

    // tslint:disable-next-line:no-any
    send(action: string, body?: unknown) {
        const sentResponse: ActionResponse<unknown> = {
            action,
            message: body,
            status: WebsocketMessageStatus.OK,
        }
        this.connection.send(JSON.stringify(sentResponse), false, true)
    }
}

