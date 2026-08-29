import { Readable } from 'node:stream'
import { LocalDriver } from './Drivers/LocalDriver'
import { MemoryDriver } from './Drivers/MemoryDriver'
import { ReadOnlyDriver } from './Drivers/ReadOnlyDriver'
import { S3Driver } from './Drivers/S3Driver'
import { ScopedDriver } from './Drivers/ScopedDriver'
import { File } from './File'
import { StorageDisk } from './StorageDisk'
import { StorageDriver } from './StorageDriver'
import { UploadedFile } from './UploadedFile'
import { StorageDiskNotFound, StorageDriverNotSupported } from './errors'
import {
    ListOptions,
    StorageConfiguration,
    StorageContent,
    StorageDiskConfig,
    TemporaryUrlOptions,
    Visibility,
    WriteOptions,
} from './types'

export type StorageDriverFactory = (config: StorageDiskConfig, name: string, storage: Storage) => StorageDriver

const defaultConfiguration: StorageConfiguration = {
    default: 'local',
    disks: {local: {driver: 'local', root: 'storage/app'}},
}

export class Storage {
    private readonly disks = new Map<string, StorageDisk>()
    private readonly factories = new Map<string, StorageDriverFactory>()
    private readonly resolving = new Set<string>()

    constructor(public readonly config: StorageConfiguration = defaultConfiguration) {
        this.extend('local', config => new LocalDriver(config as Extract<StorageDiskConfig, {driver: 'local'}>))
        this.extend('memory', config => new MemoryDriver(config as Extract<StorageDiskConfig, {driver: 'memory'}>))
        this.extend('s3', config => new S3Driver(config as Extract<StorageDiskConfig, {driver: 's3'}>))
        this.extend('scoped', config => {
            const scoped = config as Extract<StorageDiskConfig, {driver: 'scoped'}>
            return new ScopedDriver(this.disk(scoped.disk).driver(), scoped.prefix)
        })
        this.extend('read-only', config => {
            const readOnly = config as Extract<StorageDiskConfig, {driver: 'read-only'}>
            return new ReadOnlyDriver(this.disk(readOnly.disk).driver())
        })
    }

    disk(name = this.config.default): StorageDisk {
        const cached = this.disks.get(name)
        if (cached) {
            return cached
        }
        const config = this.config.disks[name]
        if (!config) {
            throw new StorageDiskNotFound(name)
        }
        if (this.resolving.has(name)) {
            throw new Error(`Circular storage disk configuration detected at '${name}'.`)
        }
        this.resolving.add(name)
        try {
            const disk = this.build(config, name)
            this.disks.set(name, disk)
            return disk
        } finally {
            this.resolving.delete(name)
        }
    }

    build(config: StorageDiskConfig, name = 'ondemand'): StorageDisk {
        const factory = this.factories.get(config.driver)
        if (!factory) {
            throw new StorageDriverNotSupported(config.driver)
        }
        return new StorageDisk(name, factory(config, name, this))
    }

    extend(driver: string, factory: StorageDriverFactory): this {
        this.factories.set(driver, factory)
        return this
    }

    set(name: string, disk: StorageDisk): this {
        this.disks.set(name, disk)
        return this
    }

    forget(name: string): this {
        this.disks.delete(name)
        return this
    }

    fake(name = this.config.default): StorageDisk {
        const disk = new StorageDisk(name, new MemoryDriver({driver: 'memory'}))
        this.set(name, disk)
        return disk
    }

    put(key: string, content: StorageContent, options?: WriteOptions): Promise<File> { return this.disk().put(key, content, options) }

    putFile(key: string, file: UploadedFile, options?: WriteOptions): Promise<File> { return this.disk().putFile(key, file, options) }

    read(key: string): Promise<Buffer> { return this.disk().read(key) }

    get(key: string): Promise<Buffer> { return this.disk().get(key) }

    readStream(key: string): Promise<Readable> { return this.disk().readStream(key) }

    json<T>(key: string): Promise<T> { return this.disk().json<T>(key) }

    exists(key: string): Promise<boolean> { return this.disk().exists(key) }

    missing(key: string): Promise<boolean> { return this.disk().missing(key) }

    stat(key: string): Promise<File> { return this.disk().stat(key) }

    list(prefix = '', options?: ListOptions) { return this.disk().list(prefix, options) }

    files(prefix = '', options?: ListOptions): Promise<File[]> { return this.disk().files(prefix, options) }

    directories(prefix = ''): Promise<string[]> { return this.disk().directories(prefix) }

    delete(key: string): Promise<void> { return this.disk().delete(key) }

    deleteDirectory(prefix: string): Promise<void> { return this.disk().deleteDirectory(prefix) }

    copy(source: string, destination: string): Promise<File> { return this.disk().copy(source, destination) }

    move(source: string, destination: string): Promise<File> { return this.disk().move(source, destination) }

    visibility(key: string): Promise<Visibility> { return this.disk().visibility(key) }

    setVisibility(key: string, visibility: Visibility): Promise<void> { return this.disk().setVisibility(key, visibility) }

    url(key: string): string { return this.disk().url(key) }

    temporaryUrl(key: string, expiresInSeconds: number, options?: TemporaryUrlOptions): Promise<string> {
        return this.disk().temporaryUrl(key, expiresInSeconds, options)
    }
}
