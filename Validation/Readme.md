# Validation

- [Introduction](#introduction)
- [Using Rules](#using-rules)
- [Available Rules](#available-rules)
- [Optional Values](#optional-values)
- [Validating Files](#validating-files)
- [Custom Rules](#custom-rules)

## Introduction

The Validation module provides small rule classes for checking input values. Forms compose these rules and collect their messages, while
individual rules may also be used directly.

## Using Rules

Rule factories return classes. Construct the returned class when validating without a form:

```ts
import { Email } from '@Typetron/Validation'

const EmailRule = Email('Please provide a valid email address')
const rule = new EmailRule()

if (!rule.passes('email', 'john@example.com')) {
    console.log(rule.message('email', 'john@example.com'))
}
```

When a message is not supplied, each built-in rule returns its default message.

## Available Rules

Typetron currently includes `Required`, `Email`, `MinLength`, `MaxLength`, `Optional`, and `FileExtension`. Parameterized rules are created
before use:

```ts
import { MaxLength, MinLength } from '@Typetron/Validation'

const shortName = new (MinLength(3))()
const limitedName = new (MaxLength(50))()
```

Forms accept both direct factories such as `Required` and configured factories such as `MinLength(3)` through `@Rules`.

## Optional Values

`Optional` has special meaning when used by a form. If the value is `undefined` or `null`, the form skips the field's remaining rules. Empty
strings are not considered missing.

## Validating Files

`FileExtension` accepts a list of extensions without leading dots:

```ts
import { File } from '@Typetron/Storage'
import { FileExtension } from '@Typetron/Validation'

const rule = new (FileExtension(['jpg', 'png']))()
const valid = rule.passes('avatar', new File('avatar.png'))
```

The rule returns `false` when the value has no extension or is not a `File`-shaped value.

## Custom Rules

Extend `Rule` and implement an identifier, `passes`, and `message`:

```ts
import { Rule } from '@Typetron/Validation'

class EvenNumber extends Rule {
    identifier = 'evenNumber'

    passes(
        attribute: string,
        value: string | number | object | boolean | undefined,
    ) {
        return typeof value === 'number' && value % 2 === 0
    }

    message(
        attribute: string,
        value: string | number | object | boolean | undefined,
    ) {
        return `The ${attribute} must be even`
    }
}
```

The identifier becomes the key for that rule in a form's error object.
