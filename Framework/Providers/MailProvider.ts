'use strict'

import { Container, Inject } from '@Typetron/Container'
import { Provider } from '../Provider'
import { MailConfig, Mailers } from '../Config'
import { CloudflareTransport, Mailer, MailError, MemoryTransport } from '@Typetron/Mail'
import { MailTransport } from '@Typetron/Mail/MailTransport'
import { SendGridTransport } from '@Typetron/Mail/Transports/SendGridTransport'

const mailers: Partial<Record<Mailers, (...args: any[]) => MailTransport>> = {
    memory: (app: Container, config: MailConfig) => {
        return new MemoryTransport()
    },
    SendGrid: (app: Container, config: MailConfig) => {
        if (!config.mailers?.SendGrid?.key) {
            throw new MailError('SendGrid key is not set', {provider: 'SendGrid'})
        }

        return new SendGridTransport(config.mailers.SendGrid?.key)
    },
    Cloudflare: (app: Container, config: MailConfig) => {
        const options = config.mailers?.Cloudflare
        if (!options) {
            throw new MailError('Cloudflare accountId and apiToken are required', {provider: 'Cloudflare'})
        }
        return new CloudflareTransport(options)
    },
}

export class MailProvider extends Provider {
    @Inject()
    config: MailConfig

    public register() {
        const transport = mailers[this.config.default]?.(this.app, this.config)
        this.app.set(Mailer, new Mailer(this.config.from, transport, this.config.replyTo))
    }
}
