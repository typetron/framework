# Typetron WebSockets

- [Introduction](#introduction)
- [Installation](#installation)
- [Using the Connection](#using-the-connection)
- [Errors and Reconnection](#errors-and-reconnection)
- [Message Format](#message-format)

## Introduction

The `@typetron/websockets` package is a browser client for Typetron WebSocket actions. It queues outgoing actions until the connection
opens, exposes responses as RxJS observables, and correlates requests by ID.

## Installation

Install the package and RxJS:

```bash
npm install @typetron/websockets rxjs
```

The client requires the browser `WebSocket` API and a module-aware frontend build.

## Using the Connection

Construct `Websocket` with the server URL. Use `on` for a response stream, `emit` for a one-way action, or `request` to await one correlated
response:

```ts
import { Websocket } from '@typetron/websockets'

interface User {
    id: number
    name: string
}

const socket = new Websocket('ws://localhost:3001')

const subscription = socket.on<User>('users.updated').subscribe(user => {
    console.log(user.name)
})

socket.emit('users.save', {
    body: {name: 'John'},
})

const user = await socket.request<User>('users.save', {
    body: {name: 'John'},
})

socket.onError({except: ['health.check']}).subscribe(response => {
    console.error(response.action, response.message)
})

socket.onConnect(() => console.log('connected'))
socket.onDisconnect(() => console.log('disconnected'))
```

The optional message may contain `body` and `parameters`. Actions emitted before the connection opens remain queued. `request` resolves with
the response's `message`, while an error response rejects it. Unsubscribe from RxJS listeners when they are no longer needed.

## Errors and Reconnection

Action errors reach the corresponding listener and the shared `onError` stream. The optional `except` list suppresses action names from that
shared stream.

When the browser socket closes, the client invokes the disconnect callback, resets its outgoing queue, and attempts to reconnect after one
second. `isConnected` is `true` only while the underlying socket is open.

## Message Format

Actions sent to the server use this shape:

```json
{
    "$id": "request-id",
    "action": "users.save",
    "message": {
        "body": {"name": "John"},
        "parameters": [1]
    }
}
```

Responses use the same ID and action name:

```json
{
    "$id": "request-id",
    "action": "users.save",
    "status": "OK",
    "message": {"id": 1, "name": "John"}
}
```

The status is `OK` or `Error`.
