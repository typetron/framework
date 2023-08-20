import { Cache } from '@Typetron/Cache'
import { Storage } from '@Typetron/Storage'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { JSONSafeParse } from '@Typetron/Support/utils'
import { CacheItem } from '@Typetron/Cache/types'

export class FileStore extends Cache {
    constructor(public storage: Storage, public directory: string) {
        super()
    }

    async has(name: string): Promise<boolean> {
        return await this.storage.exists(this.path(name))
    }

    async get<T>(name: string, defaultValue?: T | (() => T | Promise<T>)): Promise<T | undefined> {
        const item: CacheItem<T> = await this.storage.read(this.path(name))
            .then(async (data) => JSONSafeParse<CacheItem<T>>(data.toString()) ?? {value: await this.getDefaultValue<T>(defaultValue)})
            .catch(async () => ({value: await this.getDefaultValue<T>(defaultValue)}))

        if (item['date'] && item['date'] < new Date().getTime()) {
            await this.delete(name)
            return this.getDefaultValue(defaultValue)
        }

        return item['value']
    }

    async remember<T>(name: string, defaultValue?: T | (() => T | Promise<T>), durationInSeconds?: number): Promise<T | undefined> {
        const data = await this.get<T>(name)

        if (data !== undefined) {
            return data
        }

        const value = await this.getDefaultValue(defaultValue)
        await this.set(name, value, durationInSeconds)
        return value
    }

    async set(name: string, value: any, durationInSeconds?: number): Promise<void> {
        await this.storage.put(this.path(name), JSON.stringify({
            value,
            date: durationInSeconds ? Date.now() + durationInSeconds * 1000 : undefined
        } as CacheItem<unknown>))
    }

    async delete(name: string): Promise<void> {
        await this.storage.delete(this.path(name))
    }

    async flush(): Promise<void> {
        await this.storage.deleteDirectory(this.directory)
    }

    private path(key: string): string {
        const hashKey = createHash('sha1').update(key).digest('hex')
        return path.join(this.directory, '/', hashKey)
    }

    private async getDefaultValue<T>(defaultValue?: (() => (Promise<T> | T)) | T) {
        const valueFunction = typeof defaultValue === 'function'
            ? defaultValue as () => Promise<T> | T
            : () => defaultValue

        return valueFunction()
    }
}
