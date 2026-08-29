# Service Container

- [Introduction](#introduction)
- [Resolving Classes](#resolving-classes)
- [Binding Values](#binding-values)
- [Dependency Injection](#dependency-injection)
- [Scopes and Child Containers](#scopes-and-child-containers)
- [Custom Resolvers](#custom-resolvers)

## Introduction

The service container constructs classes and resolves their dependencies. Typetron uses it for controllers, providers, middleware, and other
framework services, but it may also resolve application classes directly.

## Resolving Classes

Concrete classes require no manual registration. Pass the constructor to `get` and the container will build it:

```ts
import { Container } from '@Typetron/Container'

class UserRepository {}

const container = new Container()
const users = container.get(UserRepository)
```

Classes use singleton scope by default, so subsequent calls return the same resolved instance.

## Binding Values

Use `set` when an abstraction, symbol, or string should resolve to a particular value:

```ts
abstract class StorageContract {}

class LocalStorage extends StorageContract {}

container.set(StorageContract, new LocalStorage())
container.set('appName', 'Typetron')

const storage = container.get(StorageContract)
```

A missing string binding throws `No instance found for '<name>'`.

## Dependency Injection

Constructor types are resolved automatically. The `@Inject` decorator provides property injection and may name an explicit binding:

```ts
import { Inject, Injectable } from '@Typetron/Container'

@Injectable()
class UserService {
    constructor(public users: UserRepository) {}
}

class UserController {
    @Inject()
    users: UserService

    @Inject('appName')
    appName: string
}

const controller = container.get(UserController)
```

Decorator-based injection requires TypeScript decorator metadata to be enabled, as it is in this repository's `tsconfig.json`.

## Scopes and Child Containers

Pass a `Scope` to `@Injectable` when the default singleton lifetime is not appropriate:

```ts
import { Injectable, Scope } from '@Typetron/Container'

@Injectable(Scope.TRANSIENT)
class Operation {}

const first = container.get(Operation)
const second = container.get(Operation)
```

`first` and `second` are different instances. `REQUEST` services are isolated to request containers, while `CONNECTION` services may live in
a connection container and be reused by its request children. Create those boundaries with `createChildContainer('connection')` and
`createChildContainer('request')`.

## Custom Resolvers

Extend `BaseResolver` to resolve values the default class resolver cannot construct. Add the resolver near the beginning of
`container.resolvers` when it should take precedence, and implement `canResolve` and `resolve`.

> Note: A resolver may return a promise. In that case, callers must await the value returned by `container.get`.
