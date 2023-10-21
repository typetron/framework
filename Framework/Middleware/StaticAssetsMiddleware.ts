import { Inject, Injectable } from '../../Container'
import { MiddlewareInterface, RequestHandler, RouteNotFoundError } from '../../Router'
import { Storage } from '../../Storage'
import { Http, Request, Response } from '../../Router/Http'
import { AppConfig } from '../Config'
import * as path from 'path'

@Injectable()
export class StaticAssetsMiddleware implements MiddlewareInterface {

    @Inject()
    appConfig: AppConfig

    @Inject()
    storage: Storage

    mimeTypes: {[key: string]: string} = {
        'txt': 'text/plain',
        'js': 'text/javascript',
        'html': 'text/html',
        'css': 'text/css',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
    }

    async handle(request: Request, next: RequestHandler) {
        try {
            return await next(request)
        } catch (error) {
            if (request.method.toLowerCase() === Http.Method.GET.toLowerCase() && error instanceof RouteNotFoundError) {
                return this.loadStaticAsset(error, request)
            }
            throw error
        }
    }

    async loadStaticAsset(error: RouteNotFoundError, request: Request): Promise<Response> {
        const configs = this.appConfig.staticAssets ?? []
        for (const config of configs) {
            if (!request.uri.match(config.url)) {
                continue
            }

            let realPath = path.join(config.path, request.uri)
            let extension = path.extname(realPath).substring(1)
            if (!extension) {
                realPath = path.join(realPath, 'index.html')
                extension = 'html'
            }
            if (!await this.storage.exists(realPath)) {
                if (config.basePath) {
                    const basePath = path.join(config.path, config.indexFile ?? 'index.html')

                    return this.getResponse(basePath)
                }

                continue
            }
            return this.getResponse(realPath, extension)
        }

        throw error
    }

    private async getResponse(filePath: string, extension?: string) {
        extension = extension ?? path.extname(filePath).substring(1)
        const file = await this.storage.read(filePath)
        const contentType = this.mimeTypes[extension || 'application/octet-stream'] || this.mimeTypes.txt
        return new Response(file, Http.Status.OK, {'Content-type': contentType})
    }
}

