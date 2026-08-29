# Testing

- [Introduction](#introduction)
- [Creating a Test Case](#creating-a-test-case)
- [Making HTTP Requests](#making-http-requests)
- [Authentication](#authentication)
- [Testing WebSocket Actions](#testing-websocket-actions)

## Introduction

`TestCase` boots a Typetron application once, creates an isolated child container before each test, and provides helpers for exercising
named HTTP routes and WebSocket actions without starting a network server.

## Creating a Test Case

Extend `TestCase` and implement `bootstrapApp`:

```ts
import { Application } from '@Typetron/Framework'
import { TestCase } from '@Typetron/Testing/TestCase'

class UsersTest extends TestCase {
    bootstrapApp() {
        return Application.create(process.cwd())
    }
}
```

The base `before` hook re-registers `DatabaseProvider` and replaces password hashing with a deterministic test double. Call the inherited
lifecycle hook when a test framework override would otherwise bypass it.

## Making HTTP Requests

HTTP helpers resolve the route by its registered name rather than by URL:

```ts
const response = await this.get<{id: number, name: string}>('users.read')

console.log(response.status)
console.log(response.body)
```

Use `post`, `patch`, `put`, or `delete` with a body and optional headers. For named routes with parameters, pass a tuple to those helpers:

```ts
await this.put(
    ['users.update', {User: 1}],
    {name: 'John'},
)
```

A route name that is not registered throws `Route '<name>' not found`. HTTP errors are converted to normal `Response` objects so assertions
may inspect their status and body.

## Authentication

Use `actingAs` with a user entity or `loginById` with an identity. Subsequent HTTP helpers add the generated bearer token automatically:

```ts
await this.actingAs(user)
const response = await this.get('users.me')
```

The older `login(user)` helper is deprecated; prefer `actingAs` or `loginById`.

## Testing WebSocket Actions

Call `action` with the registered action name and optional message data:

```ts
this.on<{id: number}>('users.created', user => {
    console.log(user.id)
})

const response = await this.action<{id: number}>('users.create', {
    body: {name: 'John'},
})
```

The WebSocket object is mocked. Calls to `send` and `publishAndSend` are delivered to callbacks registered with `on`.
