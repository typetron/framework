import { BaseConfig } from './BaseConfig'

export class CacheConfig extends BaseConfig<CacheConfig> {
    driver = process.env?.CACHE_DRIVER ?? 'file'

    drivers = {
        file: {
            driver: 'file',
            path: 'cache/data',
        },

        array: {
            driver: 'array',
            serialize: false,
        },

        database: {
            driver: 'database',
            table: 'cache',
            connection: null,
            lock_connection: null,
        },

        redis: {
            driver: 'redis',
            connection: 'cache',
            lock_connection: 'default',
        },

        memcached: {
            driver: process.env.CACHE_DRIVER ?? 'memcached',
            persistent_id: process.env.MEMCACHED_PERSISTENT_ID,
            sasl: [process.env.MEMCACHED_USERNAME, process.env.MEMCACHED_PASSWORD],
            options: {
                // Memcached::OPT_CONNECT_TIMEOUT : 2000,
            },
            servers: {
                host: process.env.MEMCACHED_HOST ?? '127.0.0.1',
                port: process.env.MEMCACHED_PORT ?? '11211',
                weight: 100,
            },
        },
    }
}
