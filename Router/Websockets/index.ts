import { WebSocket as uWebSocket } from 'uWebSockets.js'
import { EventResponse, WebsocketMessageStatus } from './types'
import { Container } from '@Typetron/Container'

export * from './Handler'
export * from './types'

export class WebSocket {

    id?: number | string

    constructor(public connection: uWebSocket, container: Container) {
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
    publish(topic: string, event: string, body?: any) {
        const sentResponse: EventResponse<unknown> = {
            event,
            message: body,
            status: WebsocketMessageStatus.OK,
        }
        this.connection.publish(topic, JSON.stringify(sentResponse), false, true)
    }

    // tslint:disable-next-line:no-any
    publishAndSend(topic: string, event: string, body?: any) {
        this.publish(topic, event, body)
        this.send(event, body)
    }

    // tslint:disable-next-line:no-any
    send(event: string, body?: any) {
        const sentResponse: EventResponse<unknown> = {
            event,
            message: body,
            status: WebsocketMessageStatus.OK,
        }
        this.connection.send(JSON.stringify(sentResponse), false, true)
    }
}

