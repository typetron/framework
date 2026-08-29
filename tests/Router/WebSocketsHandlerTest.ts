import { suite, test } from '@testdeck/mocha'
import { Handler, WebSocket } from '../../Router/Websockets'
import { expect } from 'chai'
import { Container, Inject } from '@Typetron/Container'
import { Action, Body, Controller } from '../../Router'
import { Request } from '../../Router/Websockets/Request'

@suite
class WebSocketsHandlerTest {

    @test
    'uses the request ID when sending and publishing messages'() {
        const sentMessages: string[] = []
        const publishedMessages: string[] = []
        const container = new Container()
        const connection = {
            send: (message: string) => sentMessages.push(message),
            publish: (_topic: string, message: string) => publishedMessages.push(message),
        }
        const socket = new WebSocket(connection as never, container).forRequest('request-id')

        socket.send('users.stream', {type: 'sent'})
        socket.publish('users', 'users.stream', {type: 'published'})

        expect(JSON.parse(sentMessages[0])).to.deep.include({
            '$id': 'request-id',
            action: 'users.stream',
            message: {type: 'sent'},
        })
        expect(JSON.parse(publishedMessages[0])).to.deep.include({
            '$id': 'request-id',
            action: 'users.stream',
            message: {type: 'published'},
        })
    }

    @test
    async 'keeps streamed message IDs isolated between concurrent requests'() {
        const sentMessages: string[] = []
        const container = new Container()
        const connection = {
            send: (message: string) => sentMessages.push(message),
        }
        const connectionSocket = new WebSocket(connection as never, container)
        const releases = new Map<string, () => void>()
        const gates = new Map<string, Promise<void>>()

        for (const body of ['first', 'second']) {
            gates.set(body, new Promise(resolve => releases.set(body, resolve)))
        }

        class StreamingController {
            @Inject()
            socket: WebSocket

            @Inject()
            request: Request

            async stream() {
                const body = this.request.body as string
                await gates.get(body)
                this.socket.send('stream.chunk', body)
            }
        }

        const handler = container.get(Handler)
        handler.addAction('stream.concurrent', StreamingController, 'stream')

        const first = handler.handle(container, new Request('stream.concurrent', 'first', 'first-id'))
        const second = handler.handle(container, new Request('stream.concurrent', 'second', 'second-id'))

        releases.get('second')?.()
        await second
        releases.get('first')?.()
        await first

        expect(sentMessages.map(message => JSON.parse(message))).to.deep.equal([
            {
                '$id': 'second-id',
                action: 'stream.chunk',
                message: 'second',
                status: 'OK',
            },
            {
                '$id': 'first-id',
                action: 'stream.chunk',
                message: 'first',
                status: 'OK',
            },
        ])
        expect(connectionSocket.id).to.equal(undefined)
    }

    @test
    'gives error when two actions have the same path'() {
        const container = new Container()

        class Controller {
            list() {}
        }

        const router = container.get(Handler)
        router.addAction('list', Controller, 'list')

        expect(() => router.addAction('list', Controller, 'index'))
            .to.throw('There is already an action with the same name: \'list\'')
    }

    @test
    async 'returns the value from the @Body'() {
        const container = Container.getInstance()

        @Controller()
        class MyController {
            @Action()
            list(@Body() value: string) {
                return value
            }

            @Action()
            create(@Body() value: string) {
                return value
            }
        }

        const router = container.get(Handler)

        const listContent = await router.handle(container, new Request('list', 'test'))
        expect(listContent.body).to.be.equal('test')

        const createContent = await router.handle(container, new Request('create'))
        expect(createContent.body).to.be.equal(undefined)
    }

}
