export enum WebsocketMessageStatus {
    OK = 'OK',
    Error = 'Error',
}

export interface Event<T> {
    event: string
    message?: T
}

export interface EventRequestMessage {
    parameters?: (string | number)[]
    // tslint:disable-next-line:no-any
    body?: any
}

export type EventRequest = Event<EventRequestMessage>

export interface EventResponse<T> extends Event<T> {
    status: WebsocketMessageStatus
}
