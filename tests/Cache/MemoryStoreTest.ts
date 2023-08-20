import { suite, test } from '@testdeck/mocha'
import { MemoryStore } from '@Typetron/Cache'
import { expect } from 'chai'

@suite
class MemoryStoreTest {
    memoryStore = new MemoryStore()

    @test
    async returnsUndefinedIfKeyDoesNotExist() {
        const value = await this.memoryStore.get('nonexistentKey')
        expect(value).to.be.undefined
    }

    @test
    async canStoreAndRetrieveData() {
        await this.memoryStore.set('testKey', 'testValue')
        expect(this.memoryStore.cache.has('testKey')).to.be.true
        const value = await this.memoryStore.get('testKey')
        expect(value).to.equal('testValue')
    }

    @test
    async canDeleteData() {
        await this.memoryStore.set('testKey', 'testValue')
        await this.memoryStore.delete('testKey')
        const value = await this.memoryStore.get('testKey')
        expect(value).to.be.undefined
    }

    @test
    async canFlushAllData() {
        await this.memoryStore.set('key1', 'value1')
        await this.memoryStore.set('key2', 'value2')
        await this.memoryStore.flush()
        const value1 = await this.memoryStore.get('key1')
        const value2 = await this.memoryStore.get('key2')
        expect(value1).to.be.undefined
        expect(value2).to.be.undefined
    }

    @test
    async respectsExpiration() {
        await this.memoryStore.set('expiringKey', 'expiringValue', 0.01)
        await new Promise(resolve => setTimeout(resolve, 11))
        const value = await this.memoryStore.get('expiringKey')
        expect(value).to.be.undefined
    }

    @test
    async canCheckIfKeyExists() {
        await this.memoryStore.set('testKey', 'testValue')
        const exists = await this.memoryStore.has('testKey')
        expect(exists).to.be.true
        const nonExistent = await this.memoryStore.has('nonexistentKey')
        expect(nonExistent).to.be.false
    }

    @test
    async canRememberValue() {
        const value = await this.memoryStore.remember('rememberKey', 'rememberValue', 0.01)
        expect(value).to.equal('rememberValue')
        expect(this.memoryStore.cache.has('rememberKey')).to.be.true
        await new Promise(resolve => setTimeout(resolve, 11))
        const expiredValue = await this.memoryStore.get('rememberKey')
        expect(expiredValue).to.be.undefined
    }

    @test
    async getMethodCanAcceptNonFunctionAndFunctionAsDefaultValue() {
        // Non-function default value
        const value1 = await this.memoryStore.get('nonexistentKey', 'defaultValue')
        expect(value1).to.equal('defaultValue')

        // Function default value
        const value2 = await this.memoryStore.get('nonexistentKey', () => 'defaultValue')
        expect(value2).to.equal('defaultValue')
    }

    @test
    async rememberMethodCanAcceptNonFunctionAndFunctionAsDefaultValue() {
        // Non-function default value
        const value1 = await this.memoryStore.remember('nonexistentKey', 'defaultValue', 0.01)
        expect(value1).to.equal('defaultValue')
        expect(this.memoryStore.cache.has('nonexistentKey')).to.be.true

        // Function default value
        const value2 = await this.memoryStore.remember('nonexistentKey2', () => 'defaultValue', 0.01)
        expect(value2).to.equal('defaultValue')
        expect(this.memoryStore.cache.has('nonexistentKey2')).to.be.true
    }
}

// import { suite, test } from '@testdeck/mocha';
// import { MemoryStore } from '@Typetron/Cache';
// import { expect } from 'chai';
// import exp from 'constants'
//
// @suite
// class MemoryStoreTest {
//
//     arrayStore = new MemoryStore();
//
//     @test
//     async returnsUndefinedIfKeyDoesNotExist() {
//         const value = await this.arrayStore.get('nonexistentKey');
//         expect(value).to.be.undefined;
//     }
//
//     @test
//     async canStoreAndRetrieveData() {
//         await this.arrayStore.set('testKey', 'testValue');
//         expect(this.arrayStore.cache.has('testKey'))
//         const value = await this.arrayStore.get('testKey');
//         expect(value).to.equal('testValue');
//     }
//
//     @test
//     async canDeleteData() {
//         await this.arrayStore.set('testKey', 'testValue');
//         await this.arrayStore.delete('testKey');
//         const value = await this.arrayStore.get('testKey');
//         expect(value).to.be.undefined;
//     }
//
//     @test
//     async canFlushAllData() {
//         await this.arrayStore.set('key1', 'value1');
//         await this.arrayStore.set('key2', 'value2');
//         await this.arrayStore.flush();
//         const value1 = await this.arrayStore.get('key1');
//         const value2 = await this.arrayStore.get('key2');
//         expect(value1).to.be.undefined;
//         expect(value2).to.be.undefined;
//     }
//
//     @test
//     async respectsExpiration() {
//         await this.arrayStore.set('expiringKey', 'expiringValue', 0.01);
//         await new Promise(resolve => setTimeout(resolve, 11));
//         const value = await this.arrayStore.get('expiringKey');
//         expect(value).to.be.undefined;
//     }
// }
