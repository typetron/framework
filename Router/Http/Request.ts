import { IncomingHttpHeaders, IncomingMessage } from 'http'
import { Http } from '.'
import { Parameters } from './Contracts'
import * as querystring from 'querystring'
import { ParsedUrlQuery } from 'querystring'
import { File } from '../../Storage'
import Busboy from 'busboy'
import * as os from 'os'
import * as fs from 'fs'
import * as Url from 'fast-url-parser'

const cacheURLs = new Array<{url: string, instance: URL}>(100)

export class Request {
    // static methodField = '_method'

    public parameters: Record<string, string | number> = {}

    private raw: {
        urlOrUri: string,
        method: Http.Method,
        headers?: IncomingHttpHeaders,
        query?: string | ParsedUrlQuery,
        cookies?: Parameters | string,
        body?: string | object,
        files?: Record<string, File | File[]>,
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private details: {
        url: string,
        uri: string,
        method: Http.Method,
        headers: IncomingHttpHeaders,
        query: ParsedUrlQuery,
        cookies: Parameters,
        body: string | object | undefined,
        files: Record<string, File | File[]>,
    } = {}

    constructor(
        urlOrUri: string,
        method: Http.Method,
        headers?: IncomingHttpHeaders,
        query?: string | ParsedUrlQuery,
        cookies?: string | Parameters,
        body?: string | object,
        files?: Record<string, File | File[]>,
    ) {
        this.raw = {
            urlOrUri,
            method,
            headers,
            query,
            cookies,
            body,
            files,
        }
    }

    get headers(): IncomingHttpHeaders {
        return this.details.headers ?? (this.details.headers = {})
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

    // get url(): string {
    //     return this.details.url (() => {
    //         return this.details.url = this.raw.url
    //     })()
    // }

    get query(): ParsedUrlQuery {
        return this.details.query ?? (() => {
            return this.details.query = typeof this.raw.query === 'object'
                ? this.raw.query
                : querystring.parse(
                    typeof this.raw.query === 'string'
                        ? this.raw.query
                        : Url.parse(this.raw.urlOrUri).search ?? ''
                )
        })()
    }

    get cookies(): Parameters {
        return this.details.cookies ?? (() => {
            return {todo: 'parse cookies'}
        })()
    }

    get body() {
        return this.details.body
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

    static async capture(message: IncomingMessage): Promise<Request> {
        const request = new this(
            message.url ?? '',
            message.method as Http.Method || Http.Method.GET,
            message.headers
        )

        if (request.method !== Http.Method.GET) {
            if (this.isMultipartRequest(message)) {
                [request.body, request.files] = await Request.loadMultipartContent(message)
            } else {
                request.body = await Request.loadSimpleContent(message)
            }

            // const overwrittenMethod = (request.body as Record<string, string | undefined>)[Request.methodField] || ''
            // request.method = Http.Method[overwrittenMethod.toUpperCase() as Http.Method] || request.method
        }

        return request
    }

    static async loadMultipartContent(incomingMessage: IncomingMessage): Promise<[string | object, Record<string, File | File[]>]> {

        return new Promise((resolve, reject) => {
            const busboy = new Busboy({headers: incomingMessage.headers})
            const files: Record<string, File | File[]> = {}
            const content: Record<string, string> = {}

            busboy.on('file', function(fieldName, file, fileName, encoding, mimetype) {
                const extension = fileName.split('.').pop()
                const fileInstance = new File(`upload_${new Date().getTime().toString()}_${String.randomAlphaNum(9)}.${extension}`)

                fileInstance.originalName = fileName
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
            busboy.on('field', function(fieldName, value) {
                content[fieldName] = value
            })
            busboy.on('finish', function() {
                resolve([content, files])
            })

            incomingMessage.pipe(busboy)
        })
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

    getHeader(name: string): IncomingHttpHeaders {
        return this.details.headers ?? (this.details.headers = {})
    }

    private static isJSONRequest(incomingMessage: IncomingMessage) {
        return incomingMessage.headers['content-type']?.includes('application/json')
    }

    private static isMultipartRequest(message: IncomingMessage) {
        return message.headers['content-type']?.includes('multipart/form-data')
    }
}
