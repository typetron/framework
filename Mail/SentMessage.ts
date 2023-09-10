import { MailAddress } from './MailAddress'
import { Mailable } from '@Typetron/Mail/Mailable'

export class SentMessage {
    readonly from: string | MailAddress
    readonly subject?: string
    readonly body?: string | {html: string, text: string}
    readonly to?: string | MailAddress | (string | MailAddress)[]
    readonly replyTo?: string | MailAddress | (string | MailAddress)[]
    readonly cc?: string | MailAddress | (string | MailAddress)[]
    readonly bcc?: string | MailAddress | (string | MailAddress)[]

    constructor(mail: Mailable) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {content, ...mailDetails} = mail
        Object.assign(this, mailDetails)
        this.body = mail.content() ?? mail.body
    }

}
