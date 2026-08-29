# Typetron Angular

- [Introduction](#introduction)
- [Installation](#installation)
- [Building Angular Forms](#building-angular-forms)
- [Validation](#validation)

## Introduction

The `@typetron/angular` package turns a Typetron `Form` class into an Angular reactive `FormGroup`. Backend field names, initial values, and
validation rules can therefore be reused by an Angular application.

## Installation

Install the package with Angular's reactive forms dependencies:

```bash
npm install @typetron/angular @angular/forms
```

The package expects compatible `@angular/core`, `@angular/common`, and `@angular/forms` packages, together with `@typetron/framework`.

## Building Angular Forms

Define the form with Typetron decorators, then pass its class to `FormBuilder.build`:

```ts
import { Component } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { FormBuilder } from '@typetron/angular'
import { Field, Form, Rules } from '@Typetron/Forms'
import { Email, Required } from '@Typetron/Validation'

class UserForm extends Form {
    @Field()
    @Rules(Required)
    name: string

    @Field()
    @Rules(Required, Email)
    email: string
}

@Component({
    imports: [ReactiveFormsModule],
    template: `<form [formGroup]="form"></form>`,
})
export class UserEditor {
    form = FormBuilder.build(UserForm)
}
```

The resulting `FormGroup` contains one control for every `@Field` in `UserForm`.

## Validation

Each Angular control delegates validation to the corresponding Typetron `FormField`. Validation failures are returned using the Typetron
rule identifiers and messages.

```ts
const email = this.form.controls.email

email.setValue('invalid')
console.log(email.errors?.email)
```

> Note: The builder creates a new Typetron form to obtain default field values. Set defaults on the form class before calling
`FormBuilder.build`.
