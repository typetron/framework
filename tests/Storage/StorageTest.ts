import { suite, test } from '@testdeck/mocha'
import { File, Storage } from '../../Storage'
import { expect } from 'chai'
import * as path from 'path'

const directory = './tests/Storage/.storage'

@suite
class StorageTest {
    storage = new Storage()

    @test
    async canReadFiles() {
        const file = new File('testFile.txt')
        file.directory = directory
        // Create the file before trying to save it
        await this.storage.put(path.join(directory, file.name), 'test content')

        const content = await this.storage.read(path.join(directory, file.name))
        expect(content).to.be.instanceOf(Buffer)
        expect(content.toString()).to.equal('test content')
    }

    @test
    async canCheckIfFileExists() {
        const file = new File('testFile.txt')
        file.directory = directory
        // Create the file before trying to save it
        await this.storage.put(path.join(directory, file.name), 'test content')

        const exists = await this.storage.exists(path.join(directory, file.name))
        expect(exists).to.be.true
    }

    @test
    async canSaveFiles() {
        const file = new File('testFile.txt')
        file.directory = directory
        // Create the file before trying to save it
        await this.storage.put(path.join(directory, file.name), 'test content')
        const savedFile = await this.storage.save(file, './tests/Storage/.storage/alternative.txt')
        expect(savedFile).to.be.instanceOf(File)
        expect(savedFile.name).to.equal(file.name)
        expect(await this.storage.exists(savedFile.path)).to.be.true
    }

    @test
    async canWriteToFile() {
        const filePath = path.join(directory, 'testFile.txt')
        const file = await this.storage.put(filePath, 'test content')
        expect(file).to.be.instanceOf(File)
        expect(file.name).to.equal('testFile.txt')
        const content = await this.storage.read(path.join(directory, file.name))
        expect(content).to.be.instanceOf(Buffer)
        expect(content.toString()).to.equal('test content')
    }

    @test
    async canCreateDirectory() {
        await this.storage.makeDirectory(directory)
        const exists = await this.storage.exists(directory)
        expect(exists).to.be.true
    }

    @test
    async canDeleteDirectory() {
        await this.storage.makeDirectory(directory)
        await this.storage.deleteDirectory(directory)
        const exists = await this.storage.exists(directory)
        expect(exists).to.be.false
    }

    @test
    async canDeleteFile() {
        const file = new File('testFile.txt')
        file.directory = directory
        // Create the file before trying to save it
        await this.storage.put(path.join(directory, file.name), 'test content')

        await this.storage.delete(path.join(directory, file.name))
        const exists = await this.storage.exists(path.join(directory, file.name))
        expect(exists).to.be.false
    }

    @test
    async cannotDeleteWithoutFileName() {
        try {
            // Attempt to delete a directory instead of a file
            await this.storage.delete(directory)
            throw new Error('Expected an error to be thrown, but none was thrown.')
        } catch (unknownError) {
            const error = unknownError as Error
            expect(error).to.be.instanceOf(Error)
            expect(error.message).to.equal('Can not delete because this path leads to a directory and not a file.')
        }
    }
}
