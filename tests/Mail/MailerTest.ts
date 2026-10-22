import { suite, test } from '@testdeck/mocha'
import { Mailable, Mailer, MemoryTransport, SentMessage } from '@Typetron/Mail'
import { expect } from 'chai'

class Order {
    constructor(public id: number) {
    }
}

class OrderShipped extends Mailable {
    constructor(public order: Order) {
        super()
    }

    content() {
        return {
            html: `<h2>Order #${this.order.id} shipped</h2>`,
            text: `Order #${this.order.id} shipped`
        }
    }
}

@suite
class MailerTest {
    mail = new Mailer({email: 'tester@test.com'}, new MemoryTransport())

    @test
    async canSendSimpleMessage() {
        const sentMessage = await this.mail.to('john@example.com')
            .from('from@example.com')
            .replyTo('replyTo@example.com')
            .subject('test')
            .cc('moreUsers@example.com')
            .bcc('evenMoreUsers@example.com')
            .send('Order #123 shipped')

        expect(sentMessage.replyTo).to.deep.equal('replyTo@example.com')
        expect(sentMessage.subject).to.deep.equal('test')
        expect(sentMessage.from).to.deep.equal('from@example.com')
        expect(sentMessage.to).to.deep.equal('john@example.com')
        expect(sentMessage.cc).to.equal('moreUsers@example.com')
        expect(sentMessage.bcc).to.equal('evenMoreUsers@example.com')
        expect(sentMessage.body).to.equal('Order #123 shipped')
        expect(sentMessage).to.be.instanceOf(SentMessage)
        expect(sentMessage.messageId).to.equal(undefined)
        expect(sentMessage.delivered).to.equal(undefined)
        expect(sentMessage.queued).to.equal(undefined)
        expect(sentMessage.permanentBounces).to.equal(undefined)
        expect(sentMessage.suppressedRecipients).to.equal(undefined)
    }

    @test
    async canSendHtmlMessage() {
        const sentMessage = await this.mail.to('john@example.com')
            .cc('moreUsers@example.com')
            .bcc('evenMoreUsers@example.com')
            .send({html: '<h2>Order #1234 shipped</h2>', text: 'Order #1234 shipped'})

        expect(sentMessage.to).to.equal('john@example.com')
        expect(sentMessage.cc).to.equal('moreUsers@example.com')
        expect(sentMessage.bcc).to.equal('evenMoreUsers@example.com')
        expect(sentMessage.body).to.deep.equal({html: '<h2>Order #1234 shipped</h2>', text: 'Order #1234 shipped'})
    }

    @test
    async canSendMailable() {
        const order = new Order(1234)

        const sentMessage = await this.mail.to('john@example.com')
            .cc('moreUsers@example.com')
            .bcc('evenMoreUsers@example.com')
            .send(new OrderShipped(order))

        expect(sentMessage.to).to.equal('john@example.com')
        expect(sentMessage.cc).to.equal('moreUsers@example.com')
        expect(sentMessage.bcc).to.equal('evenMoreUsers@example.com')
        expect(sentMessage.body).to.deep.equal({
            html: `<h2>Order #${order.id} shipped</h2>`,
            text: `Order #${order.id} shipped`
        })
    }

    @test
    async appliesDefaultReplyToToFluentAndDirectMessages() {
        const replyTo = {email: 'support@example.com', name: 'Support'}
        const mailer = new Mailer(this.mail.from, new MemoryTransport(), replyTo)
        const fluent = await mailer.to('john@example.com').send('Hello')
        const direct = await mailer.send(new OrderShipped(new Order(1234)))

        expect(fluent.replyTo).to.deep.equal(replyTo)
        expect(direct.replyTo).to.deep.equal(replyTo)
    }

    @test
    async perMessageReplyToOverridesDefaultWithoutChangingLaterMessages() {
        const mailer = new Mailer(this.mail.from, new MemoryTransport(), 'default@example.com')
        const overridden = await mailer.to('john@example.com').replyTo('override@example.com').send('Hello')
        const following = await mailer.to('jane@example.com').send('Hello')

        expect(overridden.replyTo).to.equal('override@example.com')
        expect(following.replyTo).to.equal('default@example.com')
    }

    @test
    async preservesExplicitMailableReplyToForFluentAndDirectMessages() {
        const mailer = new Mailer(this.mail.from, new MemoryTransport(), 'default@example.com')
        for (const fluent of [false, true]) {
            const message = new OrderShipped(new Order(1234))
            message.replyTo = ['support@example.com', {email: 'help@example.com', name: 'Help'}]
            const sent = fluent ? await mailer.to('john@example.com').send(message) : await mailer.send(message)
            expect(sent.replyTo).to.deep.equal(['support@example.com', {email: 'help@example.com', name: 'Help'}])
        }
    }

    @test
    async fluentReplyToOverridesMailableReplyTo() {
        const mailer = new Mailer(this.mail.from, new MemoryTransport(), 'default@example.com')
        const message = new OrderShipped(new Order(1234))
        message.replyTo = 'mailable@example.com'
        const sent = await mailer.to('john@example.com').replyTo('override@example.com').send(message)

        expect(sent.replyTo).to.equal('override@example.com')
    }

    @test
    async leavesReplyToUnsetWhenNoDefaultIsConfigured() {
        const fluent = await this.mail.to('john@example.com').send('Hello')
        const direct = await this.mail.send(new OrderShipped(new Order(1234)))

        expect(fluent.replyTo).to.equal(undefined)
        expect(direct.replyTo).to.equal(undefined)
    }
}
