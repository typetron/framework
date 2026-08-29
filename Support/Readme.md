# Support

- [Introduction](#introduction)
- [Array Helpers](#array-helpers)
- [String Helpers](#string-helpers)
- [Number Helpers](#number-helpers)
- [JSON Parsing](#json-parsing)
- [Shared Types](#shared-types)

## Introduction

The Support module contains shared TypeScript types and lightweight helpers used throughout Typetron. Importing `@Typetron/Support` also
installs the framework's array, string, and math prototype extensions.

## Array Helpers

Arrays gain collection-style operations for common filtering and transformation tasks:

```ts
import '@Typetron/Support'

const users = [
    {id: 1, name: 'John', active: true},
    {id: 2, name: 'Jane', active: false},
]

const names = users.where('active', true).pluck('name')
const byId = users.groupBy('id')
```

Other helpers include `first`, `last`, `findWhere`, `whereIn`, `whereNotIn`, `sortBy`, `unique`, `sum`, `mapAsync`, and `forEachAsync`.
Methods such as `sortBy` and `remove` mutate the original array; filtering and mapping helpers return new arrays.

## String Helpers

Strings may be capitalized or limited, and the `String` constructor can create random values:

```ts
const title = 'typetron'.capitalize()
const excerpt = 'A longer description'.limit(10)
const token = String.randomAlphaNum(24)
```

`limit` uses `...` by default and counts that ending inside the requested length.

## Number Helpers

`Math.randomInt(min, max)` returns an integer including both boundaries:

```ts
const dice = Math.randomInt(1, 6)
```

## JSON Parsing

`JSONSafeParse` returns `undefined` instead of throwing when input is empty or invalid:

```ts
import { JSONSafeParse } from '@Typetron/Support/utils'

const settings = JSONSafeParse<{theme: string}>('{"theme":"dark"}')
const invalid = JSONSafeParse('{')
```

## Shared Types

The module exports reusable types including `Type`, `Constructor`, `Abstract`, `AnyFunction`, `KeysOfType`, `ChildKeys`, and `ChildObject`.
These types describe constructors and derive child-specific keys or objects without adding runtime behavior.

> Note: Prototype helpers are global after the Support module is imported. Check for an existing helper before adding another extension with
> the same name.
