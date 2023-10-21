import { IncomingHttpHeaders, IncomingMessage } from 'http'
import { Http } from '.'
import { Parameters } from './Contracts'
import * as querystring from 'querystring'
import { ParsedUrlQuery } from 'querystring'
import { File } from '../../Storage'
import busboy, { FileInfo } from 'busboy'
import * as os from 'os'
import * as fs from 'fs'
import * as Url from 'fast-url-parser'
import { Readable } from 'stream'
import { Request as BaseRequest } from '@Typetron/Router/Request'

const cacheURLs = new Array<{url: string, instance: URL}>(100)

export class Request extends BaseRequest {
    // static methodField = '_method'

    public parameters: Record<string, string | number> = {}

    protected raw: BaseRequest['raw'] & {
        urlOrUri: string,
        method: Http.Method,
        query?: string | ParsedUrlQuery,
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    protected details: BaseRequest['details'] & {
        url: string,
        uri: string,
        method: Http.Method,
        query: ParsedUrlQuery,
    } = {}

    getHeader: <T extends string | string[]>(name: keyof IncomingHttpHeaders | string) => T | undefined

    constructor(
        urlOrUri: string,
        method: Http.Method,
        query?: string | ParsedUrlQuery,
        cookies?: string | Parameters,
        body?: string | object,
        files?: Record<string, File | File[]>,
    ) {
        super(urlOrUri, body, cookies, files)
        this.raw.urlOrUri = urlOrUri
        this.raw.method = method
        this.raw.query = query
    }

    get headers(): IncomingHttpHeaders {
        return {}
    }

    get url(): string {
        return this.details.url ?? (() => {
            const url = Url.parse(this.raw.urlOrUri)
            return this.details.url = url.format()
        })()
    }

    get uri(): string {
        return this.details.uri ?? (() => {
            const url = cacheURLs[this.raw.urlOrUri.length]?.url === this.raw.urlOrUri
                ? cacheURLs[this.raw.urlOrUri.length].instance
                : (() => {
                    cacheURLs[this.raw.urlOrUri.length] = {
                        url: this.raw.urlOrUri,
                        instance: Url.parse(this.raw.urlOrUri)
                    }
                    return cacheURLs[this.raw.urlOrUri.length].instance
                })()

            return this.details.uri = url.pathname ?? ''
        })()
    }

    get method(): Http.Method {
        return this.raw.method
    }

    get query(): ParsedUrlQuery {
        return this.details.query ?? (() => {
            return this.details.query = typeof this.raw.query === 'object'
                ? this.raw.query
                : querystring.parse(
                    typeof this.raw.query === 'string'
                        ? this.raw.query
                        : Url.parse(this.raw.urlOrUri).query ?? ''
                )
        })()
    }

    get body() {
        return this.details.body ?? (() => {
            return this.details.body = this.raw.body
        })()
    }

    get cookies(): Parameters {
        return this.details.cookies ?? (() => {
            return {todo: 'parse cookies'}
        })()
    }

    static async loadMultipartContent(incomingMessage: IncomingMessage): Promise<[string | object, Record<string, File | File[]>]> {

        return new Promise((resolve, reject) => {
            const formDataParser = busboy({headers: incomingMessage.headers})
            const files: Record<string, File | File[]> = {}
            const content: Record<string, string> = {}

            formDataParser.on('file', function(fieldName: string, file: Readable, {filename, encoding, mimeType}: FileInfo) {
                const extension = filename.split('.').pop()
                const fileInstance = new File(`upload_${new Date().getTime().toString()}_${String.randomAlphaNum(9)}.${extension}`)

                fileInstance.originalName = filename
                fileInstance.directory = os.tmpdir()
                fileInstance.saved = true

                const stream = fs.createWriteStream(fileInstance.path)
                stream.on('error', reject)

                file.on('data', function(data) {
                    stream.write(data)
                })
                file.on('end', function() {
                    stream.end()

                    const field = files[fieldName]
                    files[fieldName] = field instanceof Array ? [...field, fileInstance] : field ? [field, fileInstance] : fileInstance
                })
            })
            formDataParser.on('field', function(fieldName, value) {
                content[fieldName] = value
            })
            formDataParser.on('finish', function() {
                resolve([content, files])
            })

            incomingMessage.pipe(formDataParser)
        })
    }

    set body(body: string | object | undefined) {
        this.details.body = body
    }

    get files() {
        return this.raw.files ?? {}
    }

    set files(files: Record<string, File | File[]>) {
        this.raw.files = files
    }

    // static async capture(message: IncomingMessage): Promise<Request> {
    //     const request = new this(
    //         message.url ?? '',
    //         message.method as Http.Method || Http.Method.GET,
    //         message.headers
    //     )
    //
    //     if (request.method !== Http.Method.GET) {
    //         if (this.isMultipartRequest(message)) {
    //             [request.body, request.files] = await Request.loadMultipartContent(message)
    //         } else {
    //             request.body = await Request.loadSimpleContent(message)
    //         }
    //
    //         // const overwrittenMethod = (request.body as Record<string, string | undefined>)[Request.methodField] || ''
    //         // request.method = Http.Method[overwrittenMethod.toUpperCase() as Http.Method] || request.method
    //     }
    //
    //     return request
    // }

    private static isJSONRequest(incomingMessage: IncomingMessage): boolean {
        return Boolean(incomingMessage.headers['content-type']?.includes('application/json'))
    }

    static async loadSimpleContent(incomingMessage: IncomingMessage): Promise<string | object | undefined> {
        let rawData = ''
        incomingMessage.on('data', chunk => {
            rawData += chunk
        })

        return new Promise((resolve, reject) => {
            incomingMessage.on('end', async () => {
                try {
                    if (this.isJSONRequest(incomingMessage)) {
                        try {
                            return resolve(JSON.parse(rawData))
                        } catch (error) {
                            resolve({})
                        }
                    }

                    resolve(rawData)
                } catch (error) {
                    if (error instanceof SyntaxError) {
                        error.stack = `Value used: '${rawData}'\n at ` + error.stack
                        reject(error)
                    }
                    resolve(rawData ? rawData : undefined)
                }
            })
        })
    }

    setHeadersLoader(loader: () => IncomingHttpHeaders): void {
        Object.defineProperty(this, 'headers', {
            get: function() {
                return loader()
            },
            enumerable: true,
            configurable: true
        })
    }

    isMultipartRequest() {
        return Boolean(this.getHeader('content-type')?.includes('multipart/form-data'))
    }
}
