'use strict'

import { Provider } from '@Typetron/Framework'
import { CacheLoader } from '@Typetron/Cache/CacheLoader'
import { Cache } from '@Typetron/Cache'

export class CacheProvider extends Provider {
    public register() {
        this.app.set(Cache, this.app.get(CacheLoader).createCache())
    }
}
