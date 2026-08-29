import { suite, test } from '@testdeck/mocha'
import { Filesystem, InvalidStorageKey, MemoryDriver, ReadOnlyStorage, Storage, StorageDisk, UploadedFile, } from '../../Storage'
import { expect } from 'chai'

const directory = './tests/Storage/.storage'

@suite
class StorageTest {
    storage = new Storage({
        default: 'local',
        disks: {
            local: {driver: 'local', root: directory, url: '/storage'},
            memory: {driver: 'memory'},
            scoped: {driver: 'scoped', disk: 'memory', prefix: 'users'},
            readonly: {driver: 'read-only', disk: 'memory'},
        },
    })

    static async after() {
        await new Filesystem().deleteDirectory(directory)
    }

    @test
    async writesReadsAndDescribesLocalFiles() {
        const file = await this.storage.put('users/1.txt', 'John', {visibility: 'public'})
        expect(file.key).to.equal('users/1.txt')
        expect(file.name).to.equal('1.txt')
        expect(file.extension).to.equal('txt')
        expect((await this.storage.read(file.key)).toString()).to.equal('John')
        expect(await this.storage.exists(file.key)).to.be.true
        expect((await this.storage.stat(file.key)).size).to.equal(4)
        expect(await this.storage.visibility(file.key)).to.equal('public')
        expect(this.storage.url(file.key)).to.equal('/storage/users/1.txt')
    }

    @test
    async listsCopiesMovesAndDeletesByPrefix() {
        await this.storage.put('documents/a.txt', 'A')
        await this.storage.put('documents/nested/b.txt', 'B')
        expect((await this.storage.files('documents')).map(file => file.key)).to.deep.equal(['documents/a.txt'])
        expect((await this.storage.files('documents', {recursive: true})).map(file => file.key)).to.deep.equal([
            'documents/a.txt', 'documents/nested/b.txt',
        ])
        await this.storage.copy('documents/a.txt', 'documents/c.txt')
        await this.storage.move('documents/c.txt', 'documents/d.txt')
        expect(await this.storage.exists('documents/c.txt')).to.be.false
        expect(await this.storage.exists('documents/d.txt')).to.be.true
        await this.storage.deleteDirectory('documents')
        expect(await this.storage.exists('documents/a.txt')).to.be.false
    }

    @test
    async resolvesAndCachesNamedAndOnDemandDisks() {
        expect(this.storage.disk('memory')).to.equal(this.storage.disk('memory'))
        const onDemand = this.storage.build({driver: 'memory'})
        expect(onDemand).to.be.instanceOf(StorageDisk)
        await onDemand.put('temporary.txt', 'data')
        expect(await onDemand.exists('temporary.txt')).to.be.true

        const custom = this.storage.extend('custom', () => new MemoryDriver()).build({driver: 'custom'})
        await custom.put('custom.txt', 'data')
        expect(await custom.exists('custom.txt')).to.be.true
    }

    @test
    async scopesAndMakesDisksReadOnly() {
        await this.storage.disk('scoped').put('1.txt', 'John')
        expect(await this.storage.disk('memory').exists('users/1.txt')).to.be.true
        expect((await this.storage.disk('scoped').files()).map(file => file.key)).to.deep.equal(['1.txt'])
        await this.expectError(this.storage.disk('readonly').put('x.txt', 'x'), ReadOnlyStorage)
    }

    @test
    async providesFakeDisksWithAssertions() {
        const fake = this.storage.fake('memory')
        await fake.put('users/1.txt', 'John')
        await fake.assertExists('users/1.txt')
        await fake.assertMissing('users/2.txt')
        await fake.assertCount('users', 1)
    }

    @test
    async streamsUploadedFilesIntoAnyDisk() {
        const temporaryPath = `${directory}/upload.txt`
        await new Filesystem().put(temporaryPath, 'uploaded')
        const upload = new UploadedFile(temporaryPath, 'original.txt', 'text/plain')
        const memory = this.storage.disk('memory')
        await memory.putFile('uploads/1.txt', upload)
        expect((await memory.read('uploads/1.txt')).toString()).to.equal('uploaded')
    }

    @test
    async rejectsTraversalAndEmptyPrefixDeletion() {
        await this.expectError(this.storage.put('../escape.txt', 'x'), InvalidStorageKey)
        await this.expectError(this.storage.deleteDirectory(''), InvalidStorageKey)
    }

    private async expectError(promise: Promise<unknown>, type: new (...args: any[]) => Error) {
        try {
            await promise
            throw new Error(`Expected ${type.name} to be thrown.`)
        } catch (error) {
            expect(error).to.be.instanceOf(type)
        }
    }
}
