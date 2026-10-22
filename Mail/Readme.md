# Mail

- [Introduction](#introduction)
- [Configuration](#configuration)
- [Defining Mailables](#defining-mailables)
- [Sending Mail](#sending-mail)
- [Recipients and Message Details](#recipients-and-message-details)
- [Transports and Testing](#transports-and-testing)
- [Delivery Outcomes](#delivery-outcomes)
- [Cloudflare](#cloudflare)
- [Delivery Errors](#delivery-errors)

## Introduction

Typetron provides a fluent API for building and sending email. A `Mailer` collects recipients and message details, while a transport
performs the delivery.

## Configuration

Applications normally register `MailProvider` and configure `MailConfig`. The `default` mailer may be `memory`, `SendGrid`, or `Cloudflare`,
and `from`
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
sends through `@sendgrid/mail`. `CloudflareTransport` uses Node's built-in `fetch` to send through Cloudflare's REST API.

```ts
const [message] = transport.messages

console.log(message.to)
console.log(message.body)
```

## Delivery Outcomes

Every transport returns the shared `SentMessage` type, exported from `@Typetron/Mail`. In addition to the original message details,
it has optional `messageId`, `delivered`, `queued`, `permanentBounces`, and `suppressedRecipients` fields.

Providers populate only the information they report. An `undefined` address array means the outcome was not reported; an empty array
means the provider reported no recipients with that outcome. A successful send means the transport accepted the request, and does not
guarantee delivery to every recipient. Outcomes describe the send response and are not updated later.

Cloudflare reports delivery, queue, and permanent bounce address arrays, plus suppressed recipients and a message ID when provided.
SendGrid exposes its [X-Message-ID response header](https://www.twilio.com/docs/sendgrid/glossary/x-message-id) as `messageId`,
leaving delivery outcomes undefined. Memory transport leaves all delivery metadata undefined.

```ts
const sent = await mail.to('john@example.com').subject('Welcome').send('Welcome!')
if (sent.permanentBounces?.length) {
    console.warn('Recipients bounced:', sent.permanentBounces)
}
```

## Cloudflare

Configure a Cloudflare account ID, an API token with email sending permission, and a sender on a domain configured for
[Cloudflare Email Service](https://developers.cloudflare.com/email-service/get-started/send-emails/):

```ts
import { MailConfig } from '@Typetron/Framework'

export default new MailConfig({
    default: 'Cloudflare',
    from: {email: 'hello@example.com', name: 'Example'},
    mailers: {
        memory: {},
        Cloudflare: {
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
            apiToken: process.env.CLOUDFLARE_API_TOKEN!,
        },
    },
})
```

Registration throws `MailError` if either credential is missing or blank. For manual setup, use
`new CloudflareTransport({accountId, apiToken})` from `@Typetron/Mail` and pass it to `Mailer`.

A string body is sent as HTML, matching SendGrid. An `{html, text}` body sends both alternatives. Strings, named addresses, and address
arrays on `Mailable` are converted to Cloudflare's REST format for the sender, recipients, CC, BCC, and reply-to fields.

Delivery outcomes are available on the shared `SentMessage`; queued recipients may be delivered later. A successful API response
resolves even if some or all recipients permanently bounced or were suppressed.

Each send makes one request. The transport does not automatically retry failed or ambiguous requests, since an email may have already
been accepted before a network failure. Applications decide whether to retry.

## Delivery Errors

Cloudflare and SendGrid throw `MailError` for API rejections and network failures. `provider` identifies the service, `status` contains
the upstream HTTP status when available, `context` holds provider-specific response details, and `cause` preserves an underlying error
when available. Cloudflare also throws `MailError` for malformed responses. A network failure leaves delivery uncertain.

For Cloudflare API rejections, `context` contains the response envelope, including its `errors` array. For non-JSON responses, it
contains the response text. For SendGrid API rejections, it contains `error.response.body`.

```ts
import { MailError } from '@Typetron/Mail'

try {
    await mail.to('john@example.com').send('Hello')
} catch (error) {
    if (error instanceof MailError) {
        console.error(error.provider, error.status, error.context)
    }
    throw error
}
```

SendGrid failures now throw `MailError` instead of Router's `HttpError`. Applications choose how to translate provider failures into
their own HTTP responses.
