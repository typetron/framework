# Router

- [Introduction](#introduction)
- [HTTP Controllers](#http-controllers)
- [Request Data and Responses](#request-data-and-responses)
- [Middleware and Guards](#middleware-and-guards)
- [WebSocket Actions](#websocket-actions)
- [Loading Controllers and Starting Servers](#loading-controllers-and-starting-servers)

## Introduction

The Router maps HTTP routes and WebSocket action names to controller methods. Both transports resolve controllers and typed parameters
through the service container, and both support middleware and guards.

## HTTP Controllers

Decorate a class with `@Controller` and methods with `@Get`, `@Post`, `@Put`, `@Patch`, or `@Delete`:

```ts
import {
    Body,
    Controller,
    Get,
    Post,
    Query,
} from '@Typetron/Router'
import { Http, Response } from '@Typetron/Router/Http'
import { User } from '../Entities/User'

@Controller('users')
class UserController {
    @Get('', 'index')
    index(@Query('active') active?: string) {
        return User.where('active', active === 'true').get()
    }

    @Get(':User', 'read')
    read(user: User) {
        return user
    }

    @Post('', 'create')
    async create(@Body() data: {name: string}) {
        const user = await User.create(data)
        return new Response(user, Http.Status.CREATED)
    }
}
```

These routes are named `users.index`, `users.read`, and `users.create`. Without an explicit method name, the controller method name is used.
Two routes may share a path when their HTTP methods differ; registering the same path and method twice throws an error.

## Request Data and Responses

Prefix a path segment with `:` to capture it. Primitive `string` and `number` parameters are resolved in route order. `@Body` returns the
body, while `@Query('name')` reads one query value and converts it to a number when the decorated parameter is typed as `number`.

An entity parameter is loaded when the route parameter uses its class name, such as `:User` above. The Framework resolver calls `User.find`
and throws `EntityNotFoundError` when no row exists.

Plain controller return values become a status `200` `Response`. Return `Response` directly to control status and headers; convenience
constructors include `ok`, `notFound`, and `badRequest`.

## Middleware and Guards

Middleware surrounds the action, while guards decide whether resolved parameters may reach it:

```ts
import {
    AllowIf,
    Controller,
    Get,
    Middleware,
    RequestHandler,
} from '@Typetron/Router'
import { Guard } from '@Typetron/Router/Guard'
import { Request } from '@Typetron/Router/Http'
import { HttpMiddleware } from '@Typetron/Router/Http/Middleware'
import { User } from '../Entities/User'

class ResponseHeader extends HttpMiddleware {
    async handle(request: Request, next: RequestHandler) {
        const response = await next(request)
        response.setHeader('x-powered-by', 'Typetron')
        return response
    }
}

class CanReadUser extends Guard {
    async condition(user: User) {
        return user.id > 0
    }
}

@Controller('users')
@Middleware(ResponseHeader)
class UserController {
    @Get(':User', 'read')
    @AllowIf(CanReadUser)
    read(user: User) {
        return user
    }
}
```

Apply `@Middleware` and `@AllowIf` to a controller or method. The default `Guard.onFail` throws HTTP `401 Unauthorized`; override it when
another failure is required. Transport-specific middleware extends `HttpMiddleware` or `WebsocketMiddleware`, while `GlobalMiddleware` may
wrap both.

## WebSocket Actions

Use `@Action` for controller methods called by an action name:

```ts
import { Action, Body, Controller, OnClose, OnOpen } from '@Typetron/Router'

@Controller('users')
class UserActions {
    @Action('save')
    save(@Body() data: {name: string}) {
        return {id: 1, ...data}
    }

    @OnOpen
    opened() {}

    @OnClose
    closed() {}
}
```

The action is registered as `users.save`. Results use the same `Response` wrapper as HTTP routes. Duplicate action names throw during
registration; `@OnOpen` and `@OnClose` register optional connection lifecycle handlers.

Messages sent or published through the injected `WebSocket` while handling an action retain the incoming request's `$id`. This allows
clients to correlate every streamed message with the action that initiated it, including when multiple actions run concurrently on one
connection. Messages initiated outside an action may omit `$id`.

## Loading Controllers and Starting Servers

`Router.loadControllers(directory)` imports TypeScript controller files recursively. Importing decorated classes registers their routes and
actions.

The Framework starts the Node or uWebSockets HTTP server selected by `AppConfig.server`. Configuring `websocketsPort` starts the separate
WebSocket provider.
