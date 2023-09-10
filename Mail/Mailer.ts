import { MailTransport } from './MailTransport'
import { PendingMail } from './PendingMail'
import { Mailable } from './Mailable'
import { MailAddress } from '@Typetron/Mail/MailAddress'

export class Mailer {
    transport: MailTransport

    constructor(public from: MailAddress, transport?: MailTransport) {
        if (!transport) {
            throw new Error('Please add the MailProvider in your app in order to use the Mailing feature, ' +
                'or manually add a Mailer instance in the app container ')
        }
        this.transport = transport
    }

    to(email: string) {
        const mail = new PendingMail(this)
        mail.from(this.from)
        mail.to(email)
        return mail
    }

    async send(message: Mailable) {
        return await this.transport.send(message)
    }
}
