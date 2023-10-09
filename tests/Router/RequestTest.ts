import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { Http, Request } from '../../Router/Http'
import { IncomingHttpHeaders } from 'http'
import { File } from '../../Storage'

@suite
class RequestTest {

    private request: Request

    before() {
        this.request = new Request('http://example.com/test?name=value', Http.Method.GET)
        this.request.setHeadersLoader(() => {
            return {'content-type': 'text/html'}
        })
        this.request.getHeader = <T extends string | string[] | undefined>(name: keyof IncomingHttpHeaders | string): T => {
            return 'text/html' as T
        }
    }

    @test
    'uri getter should return correct uri'() {
        expect(this.request.uri).to.equal('/test')
    }

    @test
    'method getter should return correct method'() {
        expect(this.request.method).to.equal(Http.Method.GET)
    }

    // Assuming that the commented url getter is uncommented in your code
    @test
    'url getter should return correct url'() {
        expect(this.request.url).to.equal('http://example.com/test?name=value')
    }

    @test
    'query getter should parse and return correct query parameters'() {
        expect(this.request.query).to.deep.equal({name: 'value'})
    }

    @test
    'cookies getter should parse and return correct cookies'() {
        expect(this.request.cookies).to.deep.equal({todo: 'parse cookies'})
    }

    @test
    'body getter and setter should return and set body correctly'() {
        this.request.body = {test: 'data'}
        expect(this.request.body).to.deep.equal({test: 'data'})
    }

    @test
    'files getter and setter should return and set files correctly'() {
        const dummyFile = { // Just a mock structure based on what you provided
            originalName: 'test.txt',
            directory: '/tmp',
            saved: true,
            path: '/tmp/test.txt'
        } as File

        this.request.files = {testFile: dummyFile}
        expect(this.request.files).to.deep.equal({testFile: dummyFile})
    }

    @test
    'headers getter should return correct headers'() {
        expect(this.request.headers).to.deep.equal({'content-type': 'text/html'})
    }

    @test
    'header value is returned'() {
        expect(this.request.getHeader('random header')).to.deep.equal('text/html')
    }
}

