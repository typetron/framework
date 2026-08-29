import { Readable } from 'node:stream'
import { StorageDriver } from '../StorageDriver'
import { PathPrefixer } from '../PathPrefixer'
import { UnsupportedStorageOperation } from '../errors'
import { FileMetadata, ListOptions, StorageContent, StorageEntry, TemporaryUrlOptions, Visibility, WriteOptions } from '../types'

export class ScopedDriver extends StorageDriver {
    private readonly prefixer: PathPrefixer

    constructor(private readonly driver: StorageDriver, prefix: string) {
        super()
        this.prefixer = new PathPrefixer(prefix)
    }

    write(key: string, content: StorageContent, options?: WriteOptions): Promise<void> {
        return this.driver.write(this.key(key), content, options)
    }

    read(key: string): Promise<Buffer> { return this.driver.read(this.key(key)) }

    readStream(key: string): Promise<Readable> { return this.driver.readStream(this.key(key)) }

    exists(key: string): Promise<boolean> { return this.driver.exists(this.key(key)) }

    metadata(key: string): Promise<FileMetadata> { return this.driver.metadata(this.key(key)) }

    async* list(prefix = '', options?: ListOptions): AsyncIterable<StorageEntry> {
        for await (const entry of this.driver.list(this.prefixer.prefix(prefix, true), options)) {
            yield {...entry, key: this.prefixer.stripPrefix(entry.key)}
        }
    }

    delete(key: string): Promise<void> { return this.driver.delete(this.key(key)) }

    deleteDirectory(prefix: string): Promise<void> { return this.driver.deleteDirectory(this.key(prefix)) }

    copy(source: string, destination: string): Promise<void> { return this.driver.copy(this.key(source), this.key(destination)) }

    move(source: string, destination: string): Promise<void> { return this.driver.move(this.key(source), this.key(destination)) }

    visibility(key: string): Promise<Visibility> { return this.driver.visibility(this.key(key)) }

    setVisibility(key: string, visibility: Visibility): Promise<void> { return this.driver.setVisibility(this.key(key), visibility) }

    url(key: string): string {
        if (!this.driver.url) {
            throw new UnsupportedStorageOperation('url')
        }
        return this.driver.url(this.key(key))
    }

    temporaryUrl(key: string, expiresInSeconds: number, options?: TemporaryUrlOptions): Promise<string> {
        if (!this.driver.temporaryUrl) {
            throw new UnsupportedStorageOperation('temporaryUrl')
        }
        return this.driver.temporaryUrl(this.key(key), expiresInSeconds, options)
    }

    private key(key: string): string {
        return this.prefixer.prefix(key)
    }
}
