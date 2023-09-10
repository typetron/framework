import { Mailable } from './Mailable'
import { SentMessage } from './SentMessage'

export abstract class MailTransport {
    abstract send(message: Mailable): Promise<SentMessage>
}
