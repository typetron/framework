# Cache

- [Introduction](#introduction)
- [Using a Cache Store](#using-a-cache-store)
- [Retrieving and Remembering Values](#retrieving-and-remembering-values)
- [Available Stores](#available-stores)
- [Removing Values](#removing-values)

## Introduction

Typetron provides one cache contract for values stored in memory, on disk, or in the configured database. Each store supports the same
asynchronous operations, so application code may depend on `Cache` without knowing where values are kept.

## Using a Cache Store

The `CacheProvider` binds the configured store to the `Cache` class. A store may also be constructed directly when no application container
is available:

```ts
import { MemoryStore } from '@Typetron/Cache'

const cache = new MemoryStore()

await cache.set('user:1', {name: 'John'}, 60)
const user = await cache.get<{name: string}>('user:1')
```

The optional duration passed to `set` is measured in seconds. Omitting it keeps the value until it is removed or the store is flushed.

## Retrieving and Remembering Values

The `get` method accepts either a value or a function as its fallback. Use `remember` when the fallback should also be stored:

```ts
const users = await cache.remember('users', async () => {
    return [{id: 1, name: 'John'}]
}, 300)
```

The fallback is evaluated only when the key is unavailable. `get` returns `undefined` when no cached value or fallback is provided.

## Available Stores

`MemoryStore` keeps values in the current process. `FileStore` hashes each key and stores its serialized value below a configured directory.
`DatabaseStore` stores serialized values in a table and creates that table when it first writes a value.

The application-level `CacheConfig` supports the `memory`, `file`, and `database` drivers. The `CacheProvider` creates the selected
implementation.

> Note: Memory cache values disappear when the process exits. File and database stores persist values, but their values must be JSON
> serializable.

## Removing Values

Use `delete` to remove one key or `flush` to clear the entire store:

```ts
await cache.delete('user:1')
await cache.flush()
```

Calling `has` checks whether a key is present. Expired memory values are removed during this check, while persisted stores enforce
expiration when values are read.
