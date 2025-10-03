export enum WebsocketMessageStatus {
    OK = 'OK',
    Error = 'Error',
}

export interface Action<T> {
    action: string
    message?: T
}

export interface ActionRequestMessage {
    parameters?: (string | number)[]
    // tslint:disable-next-line:no-any
    body?: any
}

export type ActionRequest = Action<ActionRequestMessage>

export interface ActionResponse<T> extends Action<T> {
    status: WebsocketMessageStatus
}

export type ActionErrorResponse<T extends string = string> = ActionResponse<{message: T, stack: string[]}>
