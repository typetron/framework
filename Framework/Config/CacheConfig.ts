import { BaseConfig } from './BaseConfig'

export type CacheStoreKey = keyof CacheConfig['drivers']

export class CacheConfig extends BaseConfig<CacheConfig> {
    defaultStore: CacheStoreKey = process.env?.CACHE_DRIVER as CacheStoreKey ?? 'file'

    drivers = {
        file: {
            path: 'cache/data',
        },

        memory: {},

        database: {
            table: 'cache',
            connection: null,
        },
        //
        // redis: {
        //     connection: 'cache',
        //     lock_connection: 'default',
        // },
        //
        // memcached: {
        //     persistent_id: process.env.MEMCACHED_PERSISTENT_ID,
        //     sasl: [process.env.MEMCACHED_USERNAME, process.env.MEMCACHED_PASSWORD],
        //     options: {
        //         // Memcached::OPT_CONNECT_TIMEOUT : 2000,
        //     },
        //     servers: {
        //         host: process.env.MEMCACHED_HOST ?? '127.0.0.1',
        //         port: process.env.MEMCACHED_PORT ?? '11211',
        //         weight: 100,
        //     },
        // },
    }
}
