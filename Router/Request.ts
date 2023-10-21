import { File } from '../Storage'

export class Request {
    public parameters: Record<string, string | number> = {}

    protected raw: {
        name: string,
        body?: string | object,
        cookies?: Record<string, string | undefined> | string,
        files?: Record<string, File | File[]>,
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    protected details: {
        name: string,
        body: string | object | undefined,
        cookies: Record<string, string | undefined>,
        files: Record<string, File | File[]>,
    } = {}

    constructor(
        name: string,
        body?: string | object,
        cookies?: string | Record<string, string | undefined>,
        files?: Record<string, File | File[]>,
    ) {
        this.raw = {
            name,
            cookies,
            body,
            files,
        }
    }

    get name(): string {
        return this.details.name ?? (() => {
            return this.details.name = this.raw.name
        })()
    }

    get body() {
        return this.details.body ?? (() => {
            return this.details.body = this.raw.body
        })()
    }

    set body(body: string | object | undefined) {
        this.details.body = body
    }

    get cookies(): Record<string, string | undefined> {
        return this.details.cookies ?? (() => {
            return {todo: 'parse cookies'}
        })()
    }

    get files() {
        return this.raw.files ?? {}
    }

    set files(files: Record<string, File | File[]>) {
        this.raw.files = files
    }
}
