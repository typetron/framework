import { MailTransport } from '../MailTransport'
import { SentMessage } from '../SentMessage'
import { Mailable } from '../Mailable'
import { Inject } from '../../Container'
import { MailConfig } from '../../Framework'
import client from '@sendgrid/mail'
import { HttpError } from '@Typetron/Router/Http'

export class SendGridTransport extends MailTransport {
    messages: SentMessage[] = []

    @Inject()
    config: MailConfig

    constructor(key: string) {
        super()

        client.setApiKey(key)
    }

    async send(message: Mailable) {
        const sentMessage = new SentMessage(message)

        const sendGridMessage = {
            personalizations: [
                {
                    to: sentMessage.to,
                    cc: sentMessage.cc,
                    bcc: sentMessage.bcc
                },
            ],
            from: sentMessage.from,
            replyTo: sentMessage.replyTo,
            subject: sentMessage.subject,
            content: [
                {
                    type: 'text/html',
                    value: sentMessage.body
                }
            ],
            // attachments: [
            //     {
            //         content: 'PCFET0NUdGxlPkRvY3VtZW50PC90aXRsZT4KICAgIDwvaGVhZD4KCiAgICA8Ym9keT4KCiAgICA8L2JvZHk+Cgo8L2h0bWw+Cg==',
            //         filename: 'index.html',
            //         type: 'text/html',
            //         disposition: 'attachment'
            //     }
            // ],
            // categories: [
            //     'cake',
            //     'pie',
            //     'baking'
            // ],
            // sendAt: 1617260400,
            // batchId: 'AsdFgHjklQweRTYuIopzXcVBNm0aSDfGHjklmZcVbNMqWert1znmOP2asDFjkl',
            // asm: {
            //     groupId: 12345,
            //     groupsToDisplay: [
            //         12345
            //     ]
            // },
            // ipPoolName: 'transactional email',
            // mailSettings: {
            //     bypassListManagement: {
            //         enable: false
            //     },
            //     footer: {
            //         enable: false
            //     },
            //     sandboxMode: {
            //         enable: false
            //     }
            // },
            // trackingSettings: {
            //     clickTracking: {
            //         enable: true,
            //         enableText: false
            //     },
            //     openTracking: {
            //         enable: true,
            //         substitutionTag: '%open-track%'
            //     },
            //     subscriptionTracking: {
            //         enable: false
            //     }
            // }
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        /* @ts-ignore */ // SendGrid has TS issues
        await client.send(sendGridMessage).catch(error => {throw new HttpError(error.response.body.errors, error.code)})

        return sentMessage
    }
}
