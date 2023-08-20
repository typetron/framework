import { Cache } from '@Typetron/Cache'
import { CacheItem } from '@Typetron/Cache/types'

export class MemoryStore extends Cache {
    public cache: Map<string, CacheItem<unknown>> = new Map()

    async has(name: string): Promise<boolean> {
        const cacheItem = this.cache.get(name)

        if (!cacheItem) {
            return false
        }

        const currentTime = Date.now()

        if (cacheItem.date && cacheItem.date < currentTime) {
            this.cache.delete(name)
            return false
        }

        return true
    }

    async get<T>(name: string, defaultValue?: T | (() => T | Promise<T>)): Promise<T | undefined> {
        const cacheItem = this.cache.get(name)

        if (!await this.has(name)) {
            return this.getDefaultValue(defaultValue)
        }

        return cacheItem!.value as T
    }

    // return (cacheItem as CacheItem<T>).value as T
    async remember<T>(name: string, defaultValue?: T | (() => T | Promise<T>), durationInSeconds?: number): Promise<T | undefined> {
        const cacheItem = this.cache.get(name)

        if (await this.has(name)) {
            return cacheItem!.value as T
        }

        const value = await this.getDefaultValue(defaultValue)
        await this.set(name, value, durationInSeconds)
        return value
    }

    async set(name: string, value: any, durationInSeconds?: number): Promise<void> {
        const expirationTime = durationInSeconds ? Date.now() + durationInSeconds * 1000 : Infinity

        this.cache.set(name, {
            value: value,
            date: expirationTime
        })
    }

    async delete(name: string): Promise<void> {
        this.cache.delete(name)
    }

    async flush(): Promise<void> {
        this.cache.clear()
    }

    private async getDefaultValue<T>(defaultValue?: (() => (Promise<T> | T)) | T) {
        const valueFunction = typeof defaultValue === 'function'
            ? defaultValue as () => Promise<T> | T
            : () => defaultValue

        return valueFunction()
    }
}
