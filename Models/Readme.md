# Models

- [Introduction](#introduction)
- [Defining Models](#defining-models)
- [Transforming Values](#transforming-values)
- [Nested Models](#nested-models)
- [Transforming Collections](#transforming-collections)

## Introduction

Models create explicit data projections. They are useful for returning only selected fields from entities or plain objects without modifying
the original value.

## Defining Models

Extend `Model` and mark every exposed property with `@Field`:

```ts
import { Field, Model } from '@Typetron/Models'

class UserModel extends Model {
    @Field()
    id: number

    @Field()
    name: string
}
```

Properties without `@Field` are omitted. Pass a source name to `@Field('user_name')` when the model property reads from a differently named
input field.

## Transforming Values

Call the model's static `from` method with an object:

```ts
const user = UserModel.from({
    id: 1,
    name: 'John',
    password: 'secret',
})
```

The result contains `id` and `name`; `password` is not included.

## Nested Models

A property typed as another model is transformed recursively. Use `@FieldMany` for a collection:

```ts
import { Field, FieldMany, Model } from '@Typetron/Models'

class PostModel extends Model {
    @Field()
    title: string
}

class AuthorModel extends Model {
    @Field()
    name: string

    @Field()
    @FieldMany(PostModel)
    posts: PostModel[]
}
```

Nested values with a `toJSON` method are serialized before they are projected.

## Transforming Collections

`Model.from` accepts a single object, any iterable of objects, or a promise resolving to either form:

```ts
const users = UserModel.from([
    {id: 1, name: 'John'},
    {id: 2, name: 'Jane'},
])

const promisedUser = await UserModel.from(Promise.resolve({
    id: 3,
    name: 'Alex',
}))
```
