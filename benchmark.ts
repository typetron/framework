// clinic flame -- node -r ts-node/register -r tsconfig-paths/register benchmark.js

import 'reflect-metadata'
import '@Typetron/Support'
import { Handler, Http, Request } from './Router/Http'
import { Container } from './Container'
import { Get } from './Router'
import Method = Http.Method

class Controller {
    @Get()
    read() {
        return 'Hello world!!!'
    }
}

async function main() {

    const app = new Container()
    const handler = app.get(Handler)

    handler.addRoute('', Method.GET, Controller, 'read', 'read')

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // const request = await Request.capture({
    //     url: 'http://localhost:3000',
    //     method: 'GET',
    //     headers: {}
    // })
    // await handler.handle(app, request)

    console.time('test')
    for (let i = 0; i < 1_000_000_0; i++) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const request = await Request.capture({
            url: 'http://localhost:3000',
            method: 'GET',
            headers: {}
        })
        await handler.handle(app, request)
    }
    console.timeEnd('test')
}

main()
