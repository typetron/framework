# Mail

- [Introduction](#introduction)
- [Configuration](#configuration)
- [Defining Mailables](#defining-mailables)
- [Sending Mail](#sending-mail)
- [Recipients and Message Details](#recipients-and-message-details)
- [Transports and Testing](#transports-and-testing)

## Introduction

Typetron provides a fluent API for building and sending email. A `Mailer` collects recipients and message details, while a transport
performs the delivery.

## Configuration

Applications normally register `MailProvider` and configure `MailConfig`. The `default` mailer may be `memory` or `SendGrid`, and `from`
supplies the default sender.

```ts
import { MailConfig } from '@Typetron/Framework'

export default new MailConfig({
    default: 'memory',
    from: {
        email: 'hello@example.com',
        name: 'Typetron',
    },
})
```

The SendGrid transport also requires `mailers.SendGrid.key`. Constructing `Mailer` without a transport throws an error instructing the
application to register `MailProvider` or bind a mailer manually.

## Defining Mailables

Represent a reusable message by extending `Mailable` and implementing `content`:

```ts
import { Mailable } from '@Typetron/Mail'

class OrderShipped extends Mailable {
    constructor(public orderId: number) {
        super()
    }

    content() {
        return {
            html: `<h1>Order #${this.orderId} shipped</h1>`,
            text: `Order #${this.orderId} shipped`,
        }
    }
}
```

`content` may return a string or an object containing both `html` and `text`.

## Sending Mail

Begin a message with `Mailer.to`, configure it, and call `send`:

```ts
import { Mailer, MemoryTransport } from '@Typetron/Mail'

const transport = new MemoryTransport()
const mail = new Mailer({email: 'hello@example.com'}, transport)

const sent = await mail
    .to('john@example.com')
    .subject('Your order has shipped')
    .send(new OrderShipped(1234))
```

`send` resolves to the transport's `SentMessage` after the transport accepts the message.

## Recipients and Message Details

The pending message supports `from`, `to`, `replyTo`, `cc`, `bcc`, and `subject`. A plain string or `{html, text}` object may be sent
instead of a custom mailable:

```ts
await mail
    .to('john@example.com')
    .replyTo('support@example.com')
    .cc('manager@example.com')
    .send('Welcome to Typetron')
```

## Transports and Testing

`MemoryTransport` stores sent messages in its public `messages` array and is suitable for tests and local development. `SendGridTransport`
sends through `@sendgrid/mail` and converts SendGrid failures into an HTTP error.

```ts
const [message] = transport.messages

console.log(message.to)
console.log(message.body)
```
