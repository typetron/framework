# Application Framework

- [Introduction](#introduction)
- [Creating an Application](#creating-an-application)
- [Configuration](#configuration)
- [Providers and Middleware](#providers-and-middleware)
- [Authentication](#authentication)
- [Automatic Parameter Resolution](#automatic-parameter-resolution)
- [Accessing Services](#accessing-services)

## Introduction

The Framework module bootstraps a Typetron application. It loads configuration, prepares the service container, registers providers and
parameter resolvers, and starts the selected HTTP and WebSocket servers.

## Creating an Application

Use `Application.create` with the application's root directory, then start its server:

```ts
import {
    AppConfig,
    Application,
    AuthConfig,
    CacheProvider,
    DatabaseProvider,
    MailProvider,
} from '@Typetron/Framework'
import { User } from './Entities/User'

export const appConfig = new AppConfig({
    environment: 'development',
    server: 'node',
    port: 3000,
    providers: [DatabaseProvider, CacheProvider, MailProvider],
})

export const authConfig = new AuthConfig({
    entity: User,
    identityColumn: 'id',
    signature: process.env.APP_SECRET!,
    duration: 3600,
    saltRounds: 12,
})

const app = await Application.create(process.cwd())
app.startServer()
```

In a real application, each config instance is the default export of a TypeScript file in `config`. Configuration loads before
`Application.create` resolves. The second argument may select another config directory.

## Configuration

The module includes `AppConfig`, `AuthConfig`, `CacheConfig`, `DatabaseConfig`, and `MailConfig`. Constructor values replace defaults when
the application loads each file.

`AppConfig.server` selects the Node or uWebSockets HTTP server. A configured `websocketsPort` starts the separate WebSocket provider. Static
assets are served when `staticAssets` entries are present.

Authentication configuration must provide a signing `signature`. If it is missing, application creation throws an error stating that
`APP_SECRET` is not set up.

## Providers and Middleware

Providers bind application services. Middleware surrounds requests and may be global, HTTP-only, WebSocket-only, or attached by the Router:

```ts
import { AppConfig, Provider } from '@Typetron/Framework'
import { RequestHandler } from '@Typetron/Router'
import { Request } from '@Typetron/Router/Http'
import { HttpMiddleware } from '@Typetron/Router/Http/Middleware'

class SearchService {}

class SearchProvider extends Provider {
    register() {
        this.app.set(SearchService, new SearchService())
    }
}

class ResponseHeader extends HttpMiddleware {
    async handle(request: Request, next: RequestHandler) {
        const response = await next(request)
        response.setHeader('x-powered-by', 'Typetron')
        return response
    }
}

export const config = new AppConfig({
    port: 3000,
    providers: [SearchProvider],
    middleware: {
        global: [],
        http: [ResponseHeader],
        websocket: [],
    },
})
```

Typetron includes providers for database, cache, mail, and WebSockets, together with `AuthMiddleware`, `CorsMiddleware`, and
`StaticAssetsMiddleware`.

## Authentication

The `Auth` service signs and verifies user tokens. Your user may extend the provided `User` entity or implement `Authenticatable` by naming
its identity, username, and password columns.

Protect an HTTP controller with `AuthMiddleware`, then resolve the current user with `@AuthUser`:

```ts
import { AuthUser, User } from '@Typetron/Framework/Auth'
import { AuthMiddleware } from '@Typetron/Framework/Middleware'
import { Controller, Get, Middleware } from '@Typetron/Router'

@Controller('account')
@Middleware(AuthMiddleware)
class AccountController {
    @Get('me')
    me(@AuthUser() user: User) {
        return user
    }
}
```

The middleware accepts a bearer token from the `Authorization` header or a `token` field in the body. Invalid or expired tokens produce an
unauthenticated HTTP response.

## Automatic Parameter Resolution

Application bootstrap registers resolvers for forms, entities, and authenticated users. A controller parameter extending `Form` is filled
from the request body and files, then validated; failure produces status `422`. An entity parameter is loaded from a route parameter named
after its class.

## Accessing Services

An `Application` is also the root container. Resolve services with `app.get`, or use `App.get` after creation. For example, `App.get(Cache)`
returns the store registered by `CacheProvider`.
