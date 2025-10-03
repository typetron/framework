import { Observable, of, ReplaySubject, Subject, throwError } from 'rxjs'
import { filter, map, switchMap, take } from 'rxjs/operators'
import { ActionErrorResponse, ActionRequest, ActionResponse, WebsocketMessageStatus } from '@typetron/framework/Router/Websockets/types'

export class Websocket {
    socket?: WebSocket

    actionMessages$ = new Subject<ActionResponse<unknown>>()
    queuedActions$ = new ReplaySubject<ActionRequest>()
    errors$ = new Subject<ActionErrorResponse>()
    onConnectCallback: () => void
    onDisconnectCallback: () => void

    constructor(public url: string, public protocols?: string | string[]) {
        this.connect(url, protocols)
    }

    get isConnected() {
        return this.socket?.readyState === WebSocket.OPEN
    }

    connect(url?: string, protocols?: string | string[]): void {
        const socket = new WebSocket(url ?? this.url, protocols ?? this.protocols)
        this.socket = socket

        socket.onmessage = (action) => {
            const message = JSON.parse(action.data)
            this.actionMessages$.next(message)
        }
        socket.onopen = () => {
            this.onConnectCallback?.()
            this.queuedActions$.subscribe(message => {
                socket.send(JSON.stringify(message))
            })
        }

        socket.onclose = (action) => {
            this.onDisconnectCallback?.()
            this.queuedActions$ = new ReplaySubject<ActionRequest>()
            this.reconnect()
        }
    }

    onConnect(callback: () => void) {
        this.onConnectCallback = callback
    }

    onDisconnect(callback: () => void) {
        this.onDisconnectCallback = callback
    }

    reconnect(): void {
        if (this.socket?.readyState === WebSocket.CLOSED) {
            window.setTimeout(() => {
                this.connect(this.url, this.protocols)
            }, 1000)
        }
    }

    emit<T>(action: string, request?: ActionRequest['message']): void {
        const actionMessage: ActionRequest = {action, message: request}
        this.queuedActions$.next(actionMessage)
    }

    on<T>(action: string): Observable<T> {
        return this.actionMessages$.pipe(
            filter(actionMessage => actionMessage.action === action),
            switchMap(actionMessage => {
                if (actionMessage.status === WebsocketMessageStatus.Error) {
                    this.errors$.next(actionMessage as ActionErrorResponse)
                    return throwError(actionMessage)
                }
                return of(actionMessage)
            }),
            map(actionMessage => actionMessage.message)
        ) as Observable<T>
    }

    onError({except}: {except?: string[]}): Observable<ActionResponse<unknown>> {
        return this.errors$.pipe(filter(actionMessage => !(except || []).includes(actionMessage.action)))
    }

    async request<T>(action: string, message?: ActionRequest['message']): Promise<T> {
        this.emit(action, message)
        return new Promise((resolve, reject) => {
            this.on<T>(action).pipe(take(1)).subscribe({
                next: resolve,
                error: reject
            })
        })
    }
}
