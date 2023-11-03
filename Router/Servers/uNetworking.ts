import { App, HttpRequest, HttpResponse } from 'uWebSockets.js'
import { Http, Request, Response } from '@Typetron/Router/Http'
import { Buffer } from 'buffer'
import { IncomingHttpHeaders } from 'http'
import * as console from 'console'
import busboy, { FileInfo } from 'busboy'
import { File } from '@Typetron/Storage'
import { Readable } from 'stream'
import os from 'os'
import fs from 'fs'

async function handleRequest(serverResponse: HttpResponse, serverRequest: HttpRequest, handler: (request: Request) => Promise<Response>) {
    serverResponse.onAborted(() => {
        console.log('uNetworking response aborted ->', serverResponse)
    })

    try {
        const request = new Request(serverRequest.getUrl(), serverRequest.getMethod() as Http.Method, serverRequest.getQuery())
        const headers: Record<string, string> = {}

        serverRequest.forEach((name, value) => headers[name] = value)
        request.setHeadersLoader(() => headers)
        request.getHeader = <T extends string | string[] | undefined>(name: keyof IncomingHttpHeaders | string): T => {
            return serverRequest.getHeader(name.toString()) as T
        }

        if (request.method.toLowerCase() !== Http.Method.GET.toLowerCase()) {
            if (request.isMultipartRequest()) {
                [request.body, request.files] = await readForm(serverResponse, headers)
            } else {
                request.body = await readJson(serverResponse, headers['content-type'])
            }

            // const overwrittenMethod = (request.body as Record<string, string | undefined>)[Request.methodField] || ''
            // request.method = Http.Method[overwrittenMethod.toUpperCase() as Http.Method] || request.method
        }

        const response = await handler(request)
        let content = response.body as string | object | number | Array<any> | Buffer

        serverResponse.writeStatus(response.status.toString())

        if (!(content instanceof Buffer)) {
            if (content instanceof Object) {
                content = JSON.stringify(content)
                serverResponse.writeHeader('Content-Type', 'application/json')
            }
            content = String(content ?? '')
        }

        Object.keys(response.headers).forEach(header => {
            const headerValue = response.headers[header]
            if (headerValue) {
                serverResponse.writeHeader(header, String(headerValue))
            }
        })
        serverResponse.end(content)
    } catch (error) {
        console.log('error ->', error)
    }
}

export function uNetworkingServer(port: number, handler: (request: Request) => Promise<Response>) {
    const app = App({ // or maybe SSLApp?
        // key_file_name: 'misc/key.pem',
        // cert_file_name: 'misc/cert.pem',
        // passphrase: '1234'
    })
        .any('*', async (response, request) => {
            await handleRequest(response, request, handler)
        })
        .any('/*', async (response, request) => {
            await handleRequest(response, request, handler)
        })
        .listen(port, (token) => {
            if (!token) {
                console.log('Failed to listen to port ' + port)
            }
        })
}

/* Helper function for reading a posted JSON body */
function readJson(response: HttpResponse, contentType: string) {
    let buffer: Buffer
    return new Promise<object | string | undefined>((resolve, reject) => {
        response.onData((ab, isLast) => {
            const chunk = Buffer.from(ab)
            if (!isLast) {
                buffer = Buffer.concat(buffer ? [buffer, chunk] : [chunk])
                return
            }

            const content = (buffer ? Buffer.concat([buffer, chunk]) : chunk)
            if (contentType === 'application/json') {
                try {
                    const json = JSON.parse(content.toString())
                    resolve(json)
                } catch (e) {
                    resolve({})
                }
            } else {
                resolve(content)
            }

        })
    })
}

function readForm(response: HttpResponse, headers: any): Promise<[string | object, Record<string, File | File[]>]> {
    return new Promise((resolve, reject) => {
        const formDataParser = busboy({headers})
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

        response.onData((ab, isLast) => {
            formDataParser.write(Buffer.from(ab.slice(0)))
            if (isLast) {
                formDataParser.end()
            }
        })
    })

}
