import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { rejects } from 'node:assert/strict'
import { CloudflareTransport, Mailable, Mailer, MailError, SentMessage } from '@Typetron/Mail'

@suite
class CloudflareTransportTest {
    originalFetch = globalThis.fetch
    requests: {url: unknown, init: Parameters<typeof globalThis.fetch>[1]}[] = []
    response = {
        success: true,
        result: {
            delivered: ['john@example.com'],
            queued: ['later@example.com'],
            permanent_bounces: ['bounce@example.com'],
            suppressed_recipients: ['suppressed@example.com'],
            message_id: 'message-id',
        },
    }
    transport = new CloudflareTransport({accountId: 'account-id', apiToken: 'api-token'})
    mail = new Mailer({email: 'hello@example.com', name: 'Example'}, this.transport)

    before() {
        globalThis.fetch = async (url, init) => {
            this.requests.push({url, init})
            return globalThis.Response.json(this.response)
        }
    }

    after() {
        globalThis.fetch = this.originalFetch
    }

    @test
    async sendsHtmlAndMapsNamedAddressesAndDeliveryOutcomes() {
        const sent = await this.mail.to('john@example.com')
            .subject('Welcome')
            .replyTo({email: 'support@example.com', name: 'Support'})
            .cc('cc@example.com')
            .bcc({email: 'archive@example.com'})
            .send('<h1>Welcome</h1>')

        expect(this.requests).to.have.length(1)
        const {url, init} = this.requests[0]
        expect(url).to.equal('https://api.cloudflare.com/client/v4/accounts/account-id/email/sending/send')
        expect(init?.method).to.equal('POST')
        expect(init?.headers).to.deep.equal({Authorization: 'Bearer api-token', 'Content-Type': 'application/json'})
        expect(JSON.parse(init?.body as string)).to.deep.equal({
            from: {address: 'hello@example.com', name: 'Example'},
            to: 'john@example.com',
            reply_to: {address: 'support@example.com', name: 'Support'},
            cc: 'cc@example.com',
            bcc: {address: 'archive@example.com'},
            subject: 'Welcome',
            html: '<h1>Welcome</h1>',
        })
        expect(sent).to.be.instanceOf(SentMessage)
        expect(sent.delivered).to.deep.equal(['john@example.com'])
        expect(sent.queued).to.deep.equal(['later@example.com'])
        expect(sent.permanentBounces).to.deep.equal(['bounce@example.com'])
        expect(sent.suppressedRecipients).to.deep.equal(['suppressed@example.com'])
        expect(sent.messageId).to.equal('message-id')
        expect(sent.from).to.deep.equal({email: 'hello@example.com', name: 'Example'})
        expect(sent.body).to.equal('<h1>Welcome</h1>')
    }

    @test
    async evaluatesMailableContentOnceAndSupportsRecipientArrays() {
        let calls = 0

        class Welcome extends Mailable {
            content() {
                calls++
                return {html: '<h1>Welcome</h1>', text: 'Welcome'}
            }
        }

        const message = new Welcome()
        Object.assign(message, {
            from: 'hello@example.com',
            to: ['john@example.com', {email: 'jane@example.com', name: 'Jane'}],
            cc: [{email: 'cc@example.com'}],
            bcc: ['archive@example.com'],
            replyTo: ['support@example.com', {email: 'help@example.com'}],
            subject: 'Welcome',
        })
        const sent = await this.transport.send(message)
        expect(calls).to.equal(1)
        expect(JSON.parse(this.requests[0].init?.body as string)).to.deep.equal({
            from: 'hello@example.com',
            to: ['john@example.com', {address: 'jane@example.com', name: 'Jane'}],
            cc: [{address: 'cc@example.com'}],
            bcc: ['archive@example.com'],
            reply_to: ['support@example.com', {address: 'help@example.com'}],
            subject: 'Welcome',
            html: '<h1>Welcome</h1>',
            text: 'Welcome',
        })
        expect(sent.to).to.deep.equal(message.to)
    }

    @test
    async omitsUnsetFieldsAndAcceptsResponsesWithoutOptionalMetadata() {
        globalThis.fetch = async (url, init) => {
            this.requests.push({url, init})
            return globalThis.Response.json({success: true, result: {delivered: [], queued: [], permanent_bounces: []}})
        }
        const sent = await this.mail.to('john@example.com').send('Welcome')
        expect(JSON.parse(this.requests[0].init?.body as string)).to.deep.equal({
            from: {address: 'hello@example.com', name: 'Example'}, to: 'john@example.com', html: 'Welcome',
        })
        expect(sent.delivered).to.deep.equal([])
        expect(sent.queued).to.deep.equal([])
        expect(sent.permanentBounces).to.deep.equal([])
        expect(sent.suppressedRecipients).to.equal(undefined)
        expect(sent.messageId).to.equal(undefined)
    }

    @test
    async preservesApiRejectionsWithAndWithoutHttpFailure() {
        const context = {success: false, errors: [{code: 10004, message: 'email.sending.error.throttled'}], result: null}
        for (const status of [429, 200]) {
            let calls = 0
            globalThis.fetch = async () => {
                calls++
                return globalThis.Response.json(context, {status})
            }
            await rejects(this.mail.to('john@example.com').send('Hello'), error => {
                expect(error).to.be.instanceOf(MailError)
                expect(error).to.include({provider: 'Cloudflare', status})
                expect((error as MailError).context).to.deep.equal(context)
                return true
            })
            expect(calls).to.equal(1)
        }
    }

    @test
    async preservesNetworkFailuresWithoutRetrying() {
        const cause = new Error('Connection reset')
        let calls = 0
        globalThis.fetch = async () => {
            calls++
            throw cause
        }
        await rejects(this.mail.to('john@example.com').send('Hello'), error => {
            expect(error).to.be.instanceOf(MailError)
            expect(error).to.include({provider: 'Cloudflare', cause, status: undefined})
            return true
        })
        expect(calls).to.equal(1)
    }

    @test
    async preservesNonJsonResponses() {
        globalThis.fetch = async () => new globalThis.Response('Bad Gateway', {status: 502})
        await rejects(this.mail.to('john@example.com').send('Hello'), error => {
            expect(error).to.be.instanceOf(MailError)
            expect(error).to.include({provider: 'Cloudflare', status: 502, context: 'Bad Gateway'})
            expect((error as MailError).cause).to.be.instanceOf(SyntaxError)
            return true
        })
    }

    @test
    async rejectsMalformedSuccessfulResponses() {
        for (const result of [null, {}, {delivered: [123], queued: [], permanent_bounces: []}]) {
            globalThis.fetch = async () => globalThis.Response.json({success: true, result})
            await rejects(this.mail.to('john@example.com').send('Hello'), MailError)
        }
    }

    @test
    requiresCredentials() {
        for (const config of [{accountId: '', apiToken: 'token'}, {accountId: 'account', apiToken: '  '}]) {
            expect(() => new CloudflareTransport(config)).to.throw(MailError)
        }
    }
}
