# Forms

- [Introduction](#introduction)
- [Defining Forms](#defining-forms)
- [Filling Forms](#filling-forms)
- [Validating Forms](#validating-forms)
- [Optional Fields](#optional-fields)

## Introduction

Forms describe the input an application accepts. A form declares its fields, applies Validation module rules, and exposes only those fields
when it is filled or serialized.

## Defining Forms

Extend `Form` and decorate each accepted property with `@Field`. Apply validation with `@Rules`:

```ts
import { Field, Form, Rules } from '@Typetron/Forms'
import { Email, MinLength, Required } from '@Typetron/Validation'

class UserForm extends Form {
    @Field()
    @Rules(Required, MinLength(3))
    name: string

    @Field()
    @Rules(Required, Email)
    email: string
}
```

`@Field('externalName')` may be used when the exposed field name differs from the property name.

## Filling Forms

The `fill` method copies decorated fields from an input object and ignores other properties:

```ts
const form = new UserForm()

form.fill({
    name: 'John',
    email: 'john@example.com',
})

const value = form.value()
```

`value` and `toJSON` return an object containing all declared fields. `validated` returns the truthy fields that do not currently have
validation errors.

## Validating Forms

Call `valid` after filling the form:

```ts
if (!form.valid()) {
    console.log(form.errors)
}
```

Errors are grouped first by field name and then by rule identifier, such as `required` or `email`.

## Optional Fields

Use `Optional` before other constraints when a missing value is allowed:

```ts
import { MinLength, Optional } from '@Typetron/Validation'

class ProfileForm extends Form {
    @Field()
    @Rules(Optional, MinLength(10))
    biography?: string
}
```

A value of `undefined` or `null` skips all rules for an optional field. An empty string is still validated by the remaining rules.
