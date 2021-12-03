# Typetron WebSockets

This library is used to easily listen and emit WebSockets event from the browser client to a Typetron app.

#### Installation

```bash
$ npm install @typetron/websockets
```

Note: you need to have a module loader in your app for this to work (webpack, rollup, babel, parcel, etc.)

#### Listening for events

You can listen to a WebSocket event sent from the server using the _on('Event name')_ method like this on the socket
connection:

```ts
socket.on('eventName').subscribe(response => {
    console.log('Backend response', response)
})
socket.on<User>('user.update').subscribe(user => {
    console.log('User updated', user)
})
```

The _on_ method will return an observable (see [RxJS](https://rxjs.dev/) for more details) that you can use to subscribe
to.

#### Emitting events

If you want to signal the server with and event or when you want to send some data to it, you can use the _emit('event
name', data)_ method:

```ts
socket.emit('eventName');
socket.emit('eventName', "my message here");
socket.emit('eventName', {my: {message: "here"}});
```

Be aware that if you are expecting a response from the backend, you need to subscribe to the same event (or the event
the server is emitting to) using the _.on_ method.

#### Emitting and listening for server response

If you want to make a single "request" to the server, meaning that you want to emit and wait for a response at the same
time, you can use the _request('event name', data?)_ method. This will essentially make an _emit_ and listen to its
response using the _on_ method for you:

```ts
const users = await socket.request<User[]>('users.list')
const savedUser = await socket.request<User>('users.save', {name: 'John'})
```

#### Message format of the WebSocket events

The Typetron WebSocket server uses a specific message format when exchanging information between it and the clients.
These message have the following format:
_When sending a message:_

```json
{
	"event": "event name",
	"message": {
		// optional
		"body": "content sent to the controllers",
		"parameters": [
			"param1",
			"param1"
		]
		// controller method parameters (optional)
	}
}
```

_When receiving a message:_

```json
{
	"event": "event name",
	"status": "OK"
	// or "Error",
	"message": "backend response"
	// optional
}
```
