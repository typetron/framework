import { IncomingHttpHeaders, IncomingMessage } from 'http'
import * as Url from 'url'
import { Http } from '.'
import { Parameters } from './Contracts'
import * as querystring from 'querystring'
import { ParsedUrlQuery } from 'querystring'
import { File } from '../Storage'
import * as formidable from 'formidable'
import { File as FormidableFile, IncomingForm } from 'formidable'

export class Request {
    static methodField = '_method'

    public parameters: {[key: string]: string} = {}

    constructor(public uri: string,
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
            // @ts-ignore
            const form: IncomingForm = formidable({multiples: true, keepExtensions: true})
            form.parse(incomingMessage, (error, content, formidableFiles) => {
                if (error) {
                    return reject(error)
                }
                const files: Record<string, File | File[]> = {}

                Object.keys(formidableFiles).forEach(key => {
                    let formidableFile = formidableFiles[key] as FormidableFile | FormidableFile[]
                    const fieldName = key.replace('[', '').replace(']', '') // this is a 'formidable' bug
                    if (key.includes('[') && !(formidableFile instanceof Array)) {
                        formidableFile = [formidableFile]
                    }
                    if (formidableFile instanceof Array) {
                        files[fieldName] = formidableFile.map(item => this.formidableToFile(item, form.uploadDir))
                    } else {
                        files[fieldName] = this.formidableToFile(formidableFile, form.uploadDir)
                    }
                })
                resolve([content, files])
            })
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
                        return resolve(JSON.parse(rawData))
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

            const overwrittenMethod = (request.body as Record<string, string | undefined>)[Request.methodField] || ''
            request.method = Http.Method[overwrittenMethod.toUpperCase() as Http.Method] || request.method
        }

        return request
    }

    private static formidableToFile(item: FormidableFile, directory: string) {
        const fileInstance = new File(item.path.replace(directory, '').slice(1))

        fileInstance.originalName = item.name
        fileInstance.directory = directory
        fileInstance.saved = true
        return fileInstance
    }

    private static isJSONRequest(incomingMessage: IncomingMessage) {
        return incomingMessage.headers['content-type']?.includes('application/json')
    }

    private static isMultipartRequest(message: IncomingMessage) {
        return message.headers['content-type']?.includes('multipart/form-data')
    }
}
