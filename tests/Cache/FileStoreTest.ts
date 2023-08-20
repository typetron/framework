import { suite, test } from '@testdeck/mocha'
import { FileStore } from '@Typetron/Cache'
import { Storage } from '@Typetron/Storage'
import { expect } from 'chai'

const directory = './tests/Cache/.cache'

@suite
class FileStoreTest {
    storage = new Storage()
    fileStore = new FileStore(this.storage, directory)

    static async after() {
        const storage = new Storage()
        if (await storage.exists(directory)) {
            await storage.deleteDirectory(directory)
        }
    }

    @test
    async returnsUndefinedIfKeyDoesNotExist() {
        const value = await this.fileStore.get('nonexistentKey')
        expect(value).to.be.undefined
    }

    @test
    async canStoreAndRetrieveData() {
        await this.fileStore.set('testKey', 'testValue')
        const value = await this.fileStore.get('testKey')
        expect(value).to.equal('testValue')
    }

    @test
    async canDeleteData() {
        await this.fileStore.set('testKey', 'testValue')
        await this.fileStore.delete('testKey')
        const value = await this.fileStore.get('testKey')
        expect(value).to.be.undefined
    }

    @test
    async canFlushAllData() {
        await this.fileStore.set('key1', 'value1')
        await this.fileStore.set('key2', 'value2')
        await this.fileStore.flush()
        const value1 = await this.fileStore.get('key1')
        const value2 = await this.fileStore.get('key2')
        expect(value1).to.be.undefined
        expect(value2).to.be.undefined
    }

    @test
    async respectsExpiration() {
        await this.fileStore.set('expiringKey', 'expiringValue', 0.01)
        await new Promise(resolve => setTimeout(resolve, 11))
        const value = await this.fileStore.get('expiringKey')
        expect(value).to.be.undefined
    }

    @test
    async canCheckIfKeyExists() {
        await this.fileStore.set('testKey', 'testValue')
        const exists = await this.fileStore.has('testKey')
        expect(exists).to.be.true
        const nonExistent = await this.fileStore.has('nonexistentKey')
        expect(nonExistent).to.be.false
    }

    @test
    async canRememberValue() {
        const value = await this.fileStore.remember('rememberKey', 'rememberValue', 0.01)
        expect(value).to.equal('rememberValue')
        await new Promise(resolve => setTimeout(resolve, 11))
        const expiredValue = await this.fileStore.get('rememberKey')
        expect(expiredValue).to.be.undefined
    }

    @test
    async getMethodCanAcceptNonFunctionAndFunctionAsDefaultValue() {
        const value1 = await this.fileStore.get('nonexistentKey', 'defaultValue')
        expect(value1).to.equal('defaultValue')
        const value2 = await this.fileStore.get('nonexistentKey', () => 'defaultValue')
        expect(value2).to.equal('defaultValue')
    }

    @test
    async rememberMethodCanAcceptNonFunctionAndFunctionAsDefaultValue() {
        const value1 = await this.fileStore.remember('nonexistentKey', 'defaultValue', 0.01)
        expect(value1).to.equal('defaultValue')
        const value2 = await this.fileStore.remember('nonexistentKey2', () => 'defaultValue', 0.01)
        expect(value2).to.equal('defaultValue')
    }
}
