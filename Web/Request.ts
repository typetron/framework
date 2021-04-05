import { IncomingHttpHeaders, IncomingMessage } from 'http'
import * as Url from 'url'
import { Http } from '.'
import { Parameters } from './Contracts'
import * as querystring from 'querystring'
import { ParsedUrlQuery } from 'querystring'
import { File } from '../Storage'
import Busboy from 'busboy'
import * as os from 'os'
import * as fs from 'fs'

export class Request {
    // static methodField = '_method'

    public parameters: {[key: string]: string} = {}

    constructor(
        public uri: string,
        public method: Http.Method,
        public query: ParsedUrlQuery = {},
        public cookies: Parameters = {},
        public headers: IncomingHttpHeaders = {},
        public body: string | object | undefined = {},
        public files: Record<string, File | File[]> = {},
    ) {}

    // get headers() {
    //     return this.request.headers;
    // }
    //
    // get url(): string {
    //     return this.request.url || '';
    // }
    //
    // set url(url: string) {
    //     this.request.url = url;
    // }
    //
    // get method(): Http.Method {
    //     return this.request.method as Http.Method;
    // }
    //
    // set method(method: Http.Method) {
    //     this.request.method = method;
    // }

    // emit(event: string) {
    //     this.request.emit(event);
    // }

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

    static async capture(message: IncomingMessage): Promise<Request> {
        const url = Url.parse(message.url || '')

        const request = new this(
            url.pathname || '',
            message.method as Http.Method || Http.Method.GET,
            url.query ? querystring.parse(url.query) : {},
            {}, // message.headers.cookie.split(';')
            message.headers,
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

    private static isJSONRequest(incomingMessage: IncomingMessage) {
        return incomingMessage.headers['content-type']?.includes('application/json')
    }

    private static isMultipartRequest(message: IncomingMessage) {
        return message.headers['content-type']?.includes('multipart/form-data')
    }
}
