# Encryption

- [Introduction](#introduction)
- [Hashing Passwords](#hashing-passwords)
- [Signing Tokens](#signing-tokens)
- [Verifying Tokens](#verifying-tokens)

## Introduction

The Encryption module wraps password hashing and JSON Web Token operations in promise-based services that can be resolved through Typetron's
container.

## Hashing Passwords

Use `Crypt.hash` before storing a password and `Crypt.compare` when checking a submitted value:

```ts
import { Crypt } from '@Typetron/Encryption'

const crypt = new Crypt()
const password = await crypt.hash('secret', 12)
const matches = await crypt.compare('secret', password)
```

The second argument to `hash` is the bcrypt salt-round count. Both operations reject when bcrypt cannot process the supplied value.

## Signing Tokens

The `JWT` service exposes the asynchronous form of `jsonwebtoken.sign`:

```ts
import { JWT } from '@Typetron/Encryption'

const jwt = new JWT()
const token = await jwt.sign(
    {sub: 1},
    process.env.APP_SECRET!,
    {expiresIn: '1h'}
)
```

Payload and signing options follow the `jsonwebtoken` package.

## Verifying Tokens

Pass the token and the same public key or secret to `verify`:

```ts
const payload = await jwt.verify<number>(token, process.env.APP_SECRET!)

console.log(payload.sub)
```

The promise resolves to the decoded payload, including `sub`, `iat`, and `exp`, or rejects when the token is invalid or expired.
