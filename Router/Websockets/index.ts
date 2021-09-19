import { WebSocket as uWebSocket } from 'uWebSockets.js'
import { EventResponse, WebsocketMessageStatus } from './types'

export * from './Handler'
export * from './types'

export class WebSocket {

    id?: number | string

    constructor(public connection: uWebSocket) {}

    subscribe(topic: string) {
        this.connection.subscribe(topic)
    }

    // tslint:disable-next-line:no-any
    publish(topic: string, event: string, body: any) {
        const sentResponse: EventResponse<unknown> = {
            event,
            message: body,
            status: WebsocketMessageStatus.OK,
        }
        this.connection.publish(topic, JSON.stringify(sentResponse), false, true)
    }

    // tslint:disable-next-line:no-any
    publishAndSend(topic: string, event: string, body: any) {
        this.publish(topic, event, body)
        this.send(event, body)
    }

    // tslint:disable-next-line:no-any
    send(event: string, body: any) {
        const sentResponse: EventResponse<unknown> = {
            event,
            message: body,
            status: WebsocketMessageStatus.OK,
        }
        this.connection.send(JSON.stringify(sentResponse), false, true)
    }
}

