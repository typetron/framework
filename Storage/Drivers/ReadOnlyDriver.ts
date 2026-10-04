/* eslint-disable @typescript-eslint/no-unused-vars */
import { Readable } from 'node:stream'
import { StorageDriver } from '../StorageDriver'
import { ReadOnlyStorage, UnsupportedStorageOperation } from '../errors'
import { FileMetadata, ListOptions, StorageContent, StorageEntry, TemporaryUrlOptions, Visibility, WriteOptions } from '../types'

export class ReadOnlyDriver extends StorageDriver {
    constructor(private readonly driver: StorageDriver) { super() }

    write(_key: string, _content: StorageContent, _options?: WriteOptions): Promise<void> { throw new ReadOnlyStorage() }
    read(key: string): Promise<Buffer> { return this.driver.read(key) }
    readStream(key: string): Promise<Readable> { return this.driver.readStream(key) }
    exists(key: string): Promise<boolean> { return this.driver.exists(key) }
    metadata(key: string): Promise<FileMetadata> { return this.driver.metadata(key) }
    list(prefix?: string, options?: ListOptions): AsyncIterable<StorageEntry> { return this.driver.list(prefix, options) }
    delete(_key: string): Promise<void> { throw new ReadOnlyStorage() }
    deleteDirectory(_prefix: string): Promise<void> { throw new ReadOnlyStorage() }
    copy(_source: string, _destination: string): Promise<void> { throw new ReadOnlyStorage() }
    move(_source: string, _destination: string): Promise<void> { throw new ReadOnlyStorage() }
    visibility(key: string): Promise<Visibility> { return this.driver.visibility(key) }
    setVisibility(_key: string, _visibility: Visibility): Promise<void> { throw new ReadOnlyStorage() }
    url(key: string): string {
        if (!this.driver.url) {
            throw new UnsupportedStorageOperation('url')
        }
        return this.driver.url(key)
    }
    temporaryUrl(key: string, expiresInSeconds: number, options?: TemporaryUrlOptions): Promise<string> {
        if (!this.driver.temporaryUrl) {
            throw new UnsupportedStorageOperation('temporaryUrl')
        }
        return this.driver.temporaryUrl(key, expiresInSeconds, options)
    }
}
