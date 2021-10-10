import { suite, test } from '@testdeck/mocha'
import { Container } from '@Typetron/Container'
import { Handler, Http, Request } from '@Typetron/Router/Http'
import { expect } from 'chai'
import { Router } from '@Typetron/Router'
import { StaticAssetsMiddleware } from '@Typetron/Framework/Middleware/StaticAssetsMiddleware'
import { AppConfig } from '@Typetron/Framework'
import * as path from 'path'

@suite
class StaticAssetsMiddlewareTest {

    @test
    async 'resolves url to a local directory'() {
        const container = new Container()

        container.set<Partial<AppConfig>>(AppConfig, {
            staticAssets: [
                {
                    url: 'assets/.*',
                    path: path.join(__dirname, '')
                }
            ]
        })
        const router = container.get(Router)
        router.middleware.push(StaticAssetsMiddleware)

        const handler = container.get(Handler)
        const request = new Request('assets/styles.css', Http.Method.GET)
        const response = await handler.handle(container, request)

        expect(response.headers['Content-type']).to.be.equal('text/css')
        expect(String(response.body)).to.contain('color : purple')
    }

    @test
    async 'resolves url to a static asset with the exact same name'() {
        const container = new Container()

        container.set<Partial<AppConfig>>(AppConfig, {
            staticAssets: [
                {
                    url: '.*',
                    path: path.join(__dirname, 'articles')
                }
            ]
        })
        const router = container.get(Router)
        router.middleware.push(StaticAssetsMiddleware)

        const handler = container.get(Handler)
        const request = new Request('my-article.html', Http.Method.GET)
        const response = await handler.handle(container, request)

        expect(response.headers['Content-type']).to.be.equal('text/html')
        expect(String(response.body)).to.contain('article')
    }

    @test
    async 'resolves url to a static asset returning index file'() {
        const container = new Container()

        container.set<Partial<AppConfig>>(AppConfig, {
            staticAssets: [
                {
                    url: '.*',
                    path: path.join(__dirname, 'articles')
                }
            ]
        })
        const router = container.get(Router)
        router.middleware.push(StaticAssetsMiddleware)

        const handler = container.get(Handler)
        const request = new Request('some-directory', Http.Method.GET)
        const response = await handler.handle(container, request)

        expect(response.headers['Content-type']).to.be.equal('text/html')
        expect(String(response.body)).to.contain('index file')
    }

    @test
    async 'resolves url to base path'() {
        const container = new Container()

        container.set<Partial<AppConfig>>(AppConfig, {
            staticAssets: [
                {
                    url: '.*',
                    path: path.join(__dirname, 'articles/some-directory'),
                    basePath: true
                }
            ]
        })
        const router = container.get(Router)
        router.middleware.push(StaticAssetsMiddleware)

        const handler = container.get(Handler)
        const request = new Request('test', Http.Method.GET)
        const response = await handler.handle(container, request)

        expect(response.headers['Content-type']).to.be.equal('text/html')
        expect(String(response.body)).to.contain('index file')
    }

    @test
    async 'resolves to static resource of when having base path'() {
        const container = new Container()

        container.set<Partial<AppConfig>>(AppConfig, {
            staticAssets: [
                {
                    url: '.*',
                    path: path.join(__dirname, 'assets'),
                    basePath: true
                }
            ]
        })
        const router = container.get(Router)
        router.middleware.push(StaticAssetsMiddleware)

        const handler = container.get(Handler)
        const request = new Request('styles.css', Http.Method.GET)
        const response = await handler.handle(container, request)

        expect(response.headers['Content-type']).to.be.equal('text/css')
        expect(String(response.body)).to.contain('color : purple')
    }
}
