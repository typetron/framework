import { suite, test } from '@testdeck/mocha'
import { Mailable, Mailer, MemoryTransport } from '@Typetron/Mail'
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
}
