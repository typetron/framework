import { MailAddress } from '../MailAddress'
import { Mailable } from '../Mailable'
import { MailError } from '../MailError'
import { MailTransport } from '../MailTransport'
import { SentMessage } from '../SentMessage'

export interface CloudflareTransportConfig {
    accountId: string
    apiToken: string
}

function address(value: string | MailAddress) {
    return typeof value === 'string' ? value : {address: value.email, name: value.name}
}

function addresses(value: Mailable['to']) {
    return Array.isArray(value) ? value.map(address) : value === undefined ? undefined : address(value)
}

export class CloudflareTransport extends MailTransport {
    constructor(private config: CloudflareTransportConfig) {
        super()
        if (!config.accountId?.trim() || !config.apiToken?.trim()) {
            throw new MailError('Cloudflare accountId and apiToken are required', {provider: 'Cloudflare'})
        }
    }

    async send(message: Mailable): Promise<SentMessage> {
        const sentMessage = new SentMessage(message)
        const content = typeof sentMessage.body === 'string' ? {html: sentMessage.body} : sentMessage.body
        let response: Awaited<ReturnType<typeof globalThis.fetch>>
        let body: string

        try {
            response = await globalThis.fetch(
                `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(this.config.accountId)}/email/sending/send`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.config.apiToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: address(sentMessage.from),
                        to: addresses(sentMessage.to),
                        cc: addresses(sentMessage.cc),
                        bcc: addresses(sentMessage.bcc),
                        reply_to: addresses(sentMessage.replyTo),
                        subject: sentMessage.subject,
                        ...content,
                    }),
                }
            )
        } catch (cause) {
            throw new MailError('Cloudflare mail request failed', {provider: 'Cloudflare', cause})
        }

        try {
            body = await response.text()
        } catch (cause) {
            throw new MailError('Could not read Cloudflare mail response', {provider: 'Cloudflare', status: response.status, cause})
        }

        let data
        try {
            data = JSON.parse(body)
        } catch (cause) {
            throw new MailError('Cloudflare returned an invalid mail response', {
                provider: 'Cloudflare', status: response.status, context: body, cause,
            })
        }

        if (!response.ok || data?.success !== true) {
            throw new MailError('Cloudflare rejected the mail request', {
                provider: 'Cloudflare', status: response.status, context: data,
            })
        }

        const result = data.result
        const isAddresses = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string')
        if (!result || !isAddresses(result.delivered) || !isAddresses(result.queued) || !isAddresses(result.permanent_bounces)
            || (result.suppressed_recipients !== undefined && !isAddresses(result.suppressed_recipients))
            || (result.message_id !== undefined && typeof result.message_id !== 'string')) {
            throw new MailError('Cloudflare returned an invalid mail delivery result', {
                provider: 'Cloudflare', status: response.status, context: data,
            })
        }

        sentMessage.delivered = result.delivered
        sentMessage.queued = result.queued
        sentMessage.permanentBounces = result.permanent_bounces
        sentMessage.suppressedRecipients = result.suppressed_recipients
        sentMessage.messageId = result.message_id
        return sentMessage
    }
}
