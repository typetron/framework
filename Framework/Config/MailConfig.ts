import { BaseConfig } from './BaseConfig'

export type Mailers = keyof MailConfig['mailers']

export class MailConfig extends BaseConfig<MailConfig> {
    default: Mailers = process.env?.MAILER as Mailers ?? 'memory'

    from: {
        email: string,
        name?: string,
    }

    mailers: {
        memory: any,

        SendGrid?: {
            key: string,
        },
        SES?: {
            // TODO
        },
        Mailgun?: {
            // TODO
        },
        Postmark?: {
            // TODO
        },

    }
}
