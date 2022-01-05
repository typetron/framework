import { Observable, of, ReplaySubject, Subject, throwError } from 'rxjs'
import { filter, map, switchMap, take } from 'rxjs/operators'
import { EventRequest, EventResponse, WebsocketMessageStatus } from '@typetron/framework/Router/Websockets/types'

export class Websocket {
    socket?: WebSocket

    eventMessages$ = new Subject<EventResponse<unknown>>()
    queuedEvents$ = new ReplaySubject<EventRequest>()
    errors$ = new Subject<EventResponse<{message: string, stack: string}>>()
    onConnectCallback: Function

    constructor(public url: string, public protocols?: string | string[]) {
        this.connect(url, protocols)
    }

    get isConnected() {
        return this.socket?.readyState === WebSocket.OPEN
    }

    connect(url?: string, protocols?: string | string[]): void {
        const socket = new WebSocket(url ?? this.url, protocols ?? this.protocols)
        this.socket = socket

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data)
            this.eventMessages$.next(message)
        }
        socket.onopen = () => {
            this.onConnectCallback?.()
            this.queuedEvents$.subscribe(message => {
                socket.send(JSON.stringify(message))
            })
        }

        socket.onclose = (event) => {
            this.queuedEvents$ = new ReplaySubject<EventRequest>()
            this.reconnect()
        }
    }

    onConnect(callback: Function) {
        this.onConnectCallback = callback
    }

    reconnect(): void {
        if (this.socket?.readyState === WebSocket.CLOSED) {
            window.setTimeout(() => {
                this.connect(this.url, this.protocols)
            }, 1000)
        }
    }

    emit<T>(event: string, request?: EventRequest['message']): void {
        const eventMessage: EventRequest = {event, message: request}
        this.queuedEvents$.next(eventMessage)
    }

    on<T>(event: string): Observable<T> {
        return this.eventMessages$.pipe(
            filter(eventMessage => eventMessage.event === event),
            switchMap(eventMessage => {
                if (eventMessage.status === WebsocketMessageStatus.Error) {
                    this.errors$.next(eventMessage)
                    return throwError(eventMessage)
                }
                return of(eventMessage)
            }),
            map(eventMessage => eventMessage.message)
        ) as Observable<T>
    }

    onError({except}: {except?: string[]}): Observable<EventResponse<unknown>> {
        return this.errors$.pipe(filter(eventMessage => !(except || []).includes(eventMessage.event)))
    }

    async request<T>(event: string, message?: EventRequest['message']): Promise<T> {
        this.emit(event, message)
        return new Promise((resolve, reject) => {
            this.on<T>(event).pipe(take(1)).subscribe({
                next: resolve,
                error: reject
            })
        })
    }
}
