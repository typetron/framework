import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { rejects } from 'node:assert/strict'
import client from '@sendgrid/mail'
import { Mailer, MailError, SentMessage } from '@Typetron/Mail'
import { SendGridTransport } from '@Typetron/Mail/Transports/SendGridTransport'

@suite
class SendGridTransportTest {
    originalSend = client.send
    mail = new Mailer({email: 'hello@example.com'}, new SendGridTransport('SG.test-key'))

    after() {
        client.send = this.originalSend
    }

    @test
    async preservesProviderStatusDetailsAndCause() {
        const body = {errors: [{message: 'Invalid recipient', field: 'to'}]}
        const cause = Object.assign(new Error('Bad Request'), {code: 400, response: {body}})
        client.send = async () => { throw cause }
        await rejects(this.mail.to('john@example.com').send('Hello'), error => {
            expect(error).to.be.instanceOf(MailError)
            expect(error).to.include({provider: 'SendGrid', status: 400, context: body, cause})
            return true
        })
    }

    @test
    async handlesNetworkErrorsWithoutAProviderResponse() {
        const cause = Object.assign(new Error('Connection reset'), {code: 'ECONNRESET'})
        client.send = async () => { throw cause }
        await rejects(this.mail.to('john@example.com').send('Hello'), error => {
            expect(error).to.be.instanceOf(MailError)
            expect(error).to.include({provider: 'SendGrid', status: undefined, context: undefined, cause})
            return true
        })
    }

    @test
    async stillReturnsTheSentMessageOnSuccess() {
        client.send = async () => [{statusCode: 202, body: {}, headers: {}}, {}]
        const sent = await this.mail.to('john@example.com').subject('Welcome').send('Hello')
        expect(sent).to.include({to: 'john@example.com', subject: 'Welcome', body: 'Hello'})
        expect(sent.messageId).to.equal(undefined)
    }

    @test
    async reportsMessageIdWithoutInventingDeliveryOutcomes() {
        client.send = async () => [{statusCode: 202, body: {}, headers: {'x-message-id': 'sendgrid-id'}}, {}]
        const sent = await this.mail.to('john@example.com').send('Hello')
        expect(sent).to.be.instanceOf(SentMessage)
        expect(sent.messageId).to.equal('sendgrid-id')
        expect(sent.delivered).to.equal(undefined)
        expect(sent.queued).to.equal(undefined)
        expect(sent.permanentBounces).to.equal(undefined)
        expect(sent.suppressedRecipients).to.equal(undefined)
    }
}
