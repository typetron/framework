import { MailTransport } from '../MailTransport'
import { SentMessage } from '../SentMessage'
import { Mailable } from '../Mailable'

export class MemoryTransport extends MailTransport {
    messages: SentMessage[] = []

    async send(message: Mailable) {
        const sentMessage = new SentMessage(message)
        this.messages.push(sentMessage)
        return sentMessage
    }
}
