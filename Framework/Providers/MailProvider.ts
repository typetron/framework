'use strict'

import { Container, Inject } from '@Typetron/Container'
import { Provider } from '../Provider'
import { MailConfig, Mailers } from '../Config'
import { Mailer, MemoryTransport } from '@Typetron/Mail'
import { MailTransport } from '@Typetron/Mail/MailTransport'
import { SendGridTransport } from '@Typetron/Mail/Transports/SendGridTransport'

const mailers: Partial<Record<Mailers, (...args: any[]) => MailTransport>> = {
    memory: (app: Container, config: MailConfig) => {
        return new MemoryTransport()
    },
    SendGrid: (app: Container, config: MailConfig) => {
        if (!config.mailers.SendGrid?.key) {
            throw new Error('SendGrid key is not set')
        }

        return new SendGridTransport(config.mailers.SendGrid?.key)
    },
}

export class MailProvider extends Provider {
    @Inject()
    config: MailConfig

    public register() {
        const transport = mailers[this.config.default]?.(this.app, this.config)
        this.app.set(Mailer, new Mailer(this.config.from, transport))
    }
}
