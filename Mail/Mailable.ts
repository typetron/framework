import { MailAddress } from '@Typetron/Mail/MailAddress'

export class Mailable {

    from: string | MailAddress
    subject?: string
    body?: string | {html: string, text: string}
    to?: string | MailAddress | (string | MailAddress)[]
    replyTo?: string | MailAddress | (string | MailAddress)[]
    cc?: string | MailAddress | (string | MailAddress)[]
    bcc?: string | MailAddress | (string | MailAddress)[]

    content(): string | {html: string, text: string} | undefined {
        return
    }
}
