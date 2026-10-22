import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { Container } from '@Typetron/Container'
import { MailConfig, MailProvider } from '@Typetron/Framework'
import { CloudflareTransport, Mailer, MailError, MemoryTransport } from '@Typetron/Mail'

@suite
class MailProviderTest {
    register(values: ConstructorParameters<typeof MailConfig>[0]) {
        const config = new MailConfig(values)
        config.applyNewValues()
        const app = new Container()
        app.set(Container, app)
        app.set(MailConfig, config)
        app.get(MailProvider).register()
        return app.get(Mailer)
    }

    @test
    registersCloudflareFromConfiguration() {
        const mailer = this.register({
            default: 'Cloudflare',
            from: {email: 'hello@example.com'},
            mailers: {memory: {}, Cloudflare: {accountId: 'account-id', apiToken: 'api-token'}},
        })
        expect(mailer.transport).to.be.instanceOf(CloudflareTransport)
        expect(mailer.from).to.deep.equal({email: 'hello@example.com'})
    }

    @test
    rejectsMissingCloudflareCredentialsDuringRegistration() {
        expect(() => this.register({default: 'Cloudflare'})).to.throw(MailError)
        expect(() => this.register({
            default: 'Cloudflare', mailers: {memory: {}, Cloudflare: {accountId: 'account-id', apiToken: ''}},
        })).to.throw(MailError)
    }

    @test
    rejectsMissingSendGridKeyWithMailError() {
        expect(() => this.register({default: 'SendGrid'})).to.throw(MailError, 'SendGrid key is not set')
    }

    @test
    stillRegistersMemoryTransport() {
        const mailer = this.register({default: 'memory', from: {email: 'hello@example.com'}})
        expect(mailer.transport).to.be.instanceOf(MemoryTransport)
    }

    @test
    async appliesConfiguredReplyToAndAllowsPerMessageOverride() {
        const replyTo = {email: 'support@example.com', name: 'Support'}
        const mailer = this.register({default: 'memory', from: {email: 'hello@example.com'}, replyTo})

        expect((await mailer.to('john@example.com').send('Hello')).replyTo).to.deep.equal(replyTo)
        expect((await mailer.to('john@example.com').replyTo('override@example.com').send('Hello')).replyTo)
            .to.equal('override@example.com')
    }

    @test
    async leavesReplyToUnsetWithoutConfiguration() {
        const mailer = this.register({default: 'memory', from: {email: 'hello@example.com'}})
        expect((await mailer.to('john@example.com').send('Hello')).replyTo).to.equal(undefined)
    }
}
