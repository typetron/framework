export interface MailErrorOptions extends ErrorOptions {
    provider: string
    status?: number
    context?: unknown
}

export class MailError extends Error {
    readonly provider: string
    readonly status?: number
    readonly context?: unknown

    constructor(message: string, options: MailErrorOptions) {
        super(message, {cause: options.cause})
        this.name = 'MailError'
        this.provider = options.provider
        this.status = options.status
        this.context = options.context
    }
}
