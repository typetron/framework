import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { Readable } from 'node:stream'
import { InvalidStorageKey, S3Driver, StorageDisk } from '../../Storage'

class S3ClientFake {
    commands: any[] = []
    responses: any[] = []

    async send(command: any) {
        this.commands.push(command)
        return this.responses.shift() ?? {}
    }
}

@suite
class S3DriverTest {
    client = new S3ClientFake()
    driver = new S3Driver({
        driver: 's3',
        bucket: 'bucket',
        region: 'eu-central-1',
        endpoint: 'http://localhost:9000',
        forcePathStyle: true,
        prefix: 'app',
    }, this.client as never)
    disk = new StorageDisk('s3', this.driver)

    @test
    async mapsWritesAndReadsToS3Commands() {
        await this.disk.put('users/1.txt', 'John', {mimeType: 'text/plain', visibility: 'public'})
        expect(this.client.commands[0].constructor.name).to.equal('PutObjectCommand')
        expect(this.client.commands[0].input).to.include({Bucket: 'bucket', Key: 'app/users/1.txt', ACL: 'public-read'})

        this.client.responses.push({Body: Readable.from(Buffer.from('John'))})
        expect((await this.disk.read('users/1.txt')).toString()).to.equal('John')
        expect(this.client.commands[1].constructor.name).to.equal('GetObjectCommand')
    }

    @test
    async paginatesAndStripsConfiguredPrefix() {
        this.client.responses.push(
            {IsTruncated: true, NextContinuationToken: 'next', Contents: [{Key: 'app/a.txt', Size: 1}]},
            {IsTruncated: false, Contents: [{Key: 'app/b.txt', Size: 2}]},
        )
        expect((await this.disk.files('', {recursive: true})).map(file => file.key)).to.deep.equal(['a.txt', 'b.txt'])
        expect(this.client.commands.map(command => command.input.ContinuationToken)).to.deep.equal([undefined, 'next'])
    }

    @test
    async movesOnlyAfterCopySucceeds() {
        this.client.responses.push({}, {})
        await this.disk.move('a.txt', 'b.txt')
        expect(this.client.commands.map(command => command.constructor.name)).to.deep.equal(['CopyObjectCommand', 'DeleteObjectCommand'])
        expect(this.driver.url('a b.txt')).to.equal('http://localhost:9000/bucket/app/a%20b.txt')
    }

    @test
    async doesNotDeleteWhenCopyFails() {
        this.client.send = async (command: any) => {
            this.client.commands.push(command)
            throw new Error('copy failed')
        }
        try {
            await this.disk.move('a.txt', 'b.txt')
            throw new Error('Expected copy to fail.')
        } catch (error) {
            expect((error as Error).message).to.equal('copy failed')
        }
        expect(this.client.commands.map(command => command.constructor.name)).to.deep.equal(['CopyObjectCommand'])
    }

    @test
    async createsPresignedUrlsWithoutARequest() {
        const driver = new S3Driver({
            driver: 's3',
            bucket: 'bucket',
            region: 'eu-central-1',
            credentials: {accessKeyId: 'key', secretAccessKey: 'secret'},
        })
        const url = await driver.temporaryUrl('reports/1.pdf', 300)
        expect(url).to.include('reports/1.pdf')
        expect(url).to.include('X-Amz-Expires=300')
    }

    @test
    async refusesToDeleteTheWholeBucket() {
        try {
            await this.driver.deleteDirectory('')
            throw new Error('Expected empty prefix to fail.')
        } catch (error) {
            expect(error).to.be.instanceOf(InvalidStorageKey)
        }
        expect(this.client.commands).to.be.empty
    }
}
