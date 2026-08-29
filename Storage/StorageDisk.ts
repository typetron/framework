import { File } from './File'
import { UploadedFile } from './UploadedFile'
import { StorageDriver } from './StorageDriver'
import { UnsupportedStorageOperation } from './errors'
import { ListOptions, StorageContent, StorageEntry, TemporaryUrlOptions, Visibility, WriteOptions } from './types'

export class StorageDisk {
    constructor(public readonly name: string, private readonly storageDriver: StorageDriver) {}

    driver<T extends StorageDriver = StorageDriver>(): T {
        return this.storageDriver as T
    }

    async put(key: string, content: StorageContent, options: WriteOptions = {}): Promise<File> {
        await this.storageDriver.write(key, content, options)
        return new File(key, this.name, {mimeType: options.mimeType, metadata: options.metadata, visibility: options.visibility})
    }

    putFile(key: string, file: UploadedFile, options: WriteOptions = {}): Promise<File> {
        return this.put(key, file.stream(), {mimeType: file.mimeType, ...options})
    }

    read(key: string): Promise<Buffer> { return this.storageDriver.read(key) }

    get(key: string): Promise<Buffer> { return this.read(key) }

    readStream(key: string) { return this.storageDriver.readStream(key) }

    async json<T>(key: string): Promise<T> {
        return JSON.parse((await this.read(key)).toString()) as T
    }

    exists(key: string): Promise<boolean> { return this.storageDriver.exists(key) }

    async missing(key: string): Promise<boolean> { return !(await this.exists(key)) }

    async stat(key: string): Promise<File> {
        return new File(key, this.name, await this.storageDriver.metadata(key))
    }

    list(prefix = '', options: ListOptions = {}): AsyncIterable<StorageEntry> {
        return this.storageDriver.list(prefix, options)
    }

    async files(prefix = '', options: ListOptions = {}): Promise<File[]> {
        const files: File[] = []
        for await (const entry of this.list(prefix, options)) {
            if (entry.type === 'file') {
                files.push(new File(entry.key, this.name, {
                    size: entry.size,
                    lastModified: entry.lastModified,
                    mimeType: entry.mimeType,
                    etag: entry.etag,
                    metadata: entry.metadata,
                    visibility: entry.visibility,
                }))
            }
        }
        return files
    }

    async directories(prefix = ''): Promise<string[]> {
        const directories: string[] = []
        for await (const entry of this.list(prefix)) {
            if (entry.type === 'directory') {
                directories.push(entry.key)
            }
        }
        return directories
    }

    delete(key: string): Promise<void> { return this.storageDriver.delete(key) }

    deleteDirectory(prefix: string): Promise<void> { return this.storageDriver.deleteDirectory(prefix) }

    async copy(source: string, destination: string): Promise<File> {
        await this.storageDriver.copy(source, destination)
        return new File(destination, this.name)
    }

    async move(source: string, destination: string): Promise<File> {
        await this.storageDriver.move(source, destination)
        return new File(destination, this.name)
    }

    visibility(key: string): Promise<Visibility> { return this.storageDriver.visibility(key) }

    setVisibility(key: string, visibility: Visibility): Promise<void> { return this.storageDriver.setVisibility(key, visibility) }

    url(key: string): string {
        if (!this.storageDriver.url) {
            throw new UnsupportedStorageOperation('url')
        }
        return this.storageDriver.url(key)
    }

    temporaryUrl(key: string, expiresInSeconds: number, options?: TemporaryUrlOptions): Promise<string> {
        if (!this.storageDriver.temporaryUrl) {
            throw new UnsupportedStorageOperation('temporaryUrl')
        }
        return this.storageDriver.temporaryUrl(key, expiresInSeconds, options)
    }

    async assertExists(key: string): Promise<void> {
        if (!(await this.exists(key))) {
            throw new Error(`Expected storage file '${key}' to exist.`)
        }
    }

    async assertMissing(key: string): Promise<void> {
        if (await this.exists(key)) {
            throw new Error(`Expected storage file '${key}' to be missing.`)
        }
    }

    async assertCount(prefix: string, count: number, recursively = false): Promise<void> {
        const files = await this.files(prefix, {recursive: recursively})
        if (files.length !== count) {
            throw new Error(`Expected ${count} storage files below '${prefix}', found ${files.length}.`)
        }
    }
}
