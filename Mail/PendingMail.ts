import { Mailer } from './index'
import { Mailable } from './Mailable'
import { MailAddress } from '@Typetron/Mail/MailAddress'

export class PendingMail {

    details: {
        subject?: string
        from: string | MailAddress
        to?: string | MailAddress
        replyTo?: string | MailAddress
        cc?: string | MailAddress
        bcc?: string | MailAddress
        body?: string | {html: string, text: string}
    } = {from: ''}

    constructor(private mailer: Mailer) {
    }

    subject(subject: string) {
        this.details.subject = subject
        return this
    }

    from(email: string | MailAddress) {
        this.details.from = email
        return this
    }

    to(email: string | MailAddress) {
        this.details.to = email
        return this
    }

    replyTo(email: string | MailAddress) {
        this.details.replyTo = email
        return this
    }

    cc(email: string | MailAddress) {
        this.details.cc = email
        return this
    }

    bcc(email: string | MailAddress) {
        this.details.bcc = email
        return this
    }

    async send(body: string | {html: string, text: string} | Mailable) {
        let mail
        if (body instanceof Mailable) {
            mail = body
        } else {
            mail = new Mailable()
            mail.body = body
        }

        mail.subject = this.details.subject
        mail.from = this.details.from
        mail.to = this.details.to
        mail.replyTo = this.details.replyTo
        mail.cc = this.details.cc
        mail.bcc = this.details.bcc

        return this.mailer.send(mail)
    }
}
