'use strict'

import { Container, Inject } from '@Typetron/Container'
import { Cache, DatabaseStore, FileStore, MemoryStore } from '@Typetron/Cache'
import { Storage } from '@Typetron/Storage'
import { Provider } from '../Provider'
import { CacheConfig, CacheStoreKey } from '../Config'

const cacheStores: Record<CacheStoreKey, (...args: any[]) => Cache> = {
    file: (app: Container, config: CacheConfig) => {
        return new FileStore(app.get(Storage), config.drivers.file.path)
    },
    memory: () => {
        return new MemoryStore()
    },
    database: (app: Container, config: CacheConfig) => {
        return new DatabaseStore(config.drivers.database.table)
    },
}

export class CacheProvider extends Provider {
    @Inject()
    config: CacheConfig

    public register() {
        this.app.set(Cache, cacheStores[this.config.default](this.app, this.config))
    }
}
