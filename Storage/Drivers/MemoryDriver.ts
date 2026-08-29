import { Readable } from 'node:stream'
import { StorageDriver } from '../StorageDriver'
import { PathPrefixer } from '../PathPrefixer'
import { StorageFileNotFound, UnsupportedStorageOperation } from '../errors'
import { FileMetadata, ListOptions, MemoryDiskConfig, StorageContent, StorageEntry, Visibility, WriteOptions } from '../types'

interface MemoryItem extends FileMetadata {
    content: Buffer
}

export class MemoryDriver extends StorageDriver {
    private readonly items = new Map<string, MemoryItem>()
    private readonly prefixer = new PathPrefixer()

    constructor(private readonly config: MemoryDiskConfig = {driver: 'memory'}) {
        super()
    }

    async write(key: string, content: StorageContent, options: WriteOptions = {}): Promise<void> {
        const normalized = this.prefixer.normalize(key)
        const buffer = content instanceof Readable
            ? Buffer.concat(await Array.fromAsync(content, chunk => Buffer.from(chunk)))
            : Buffer.from(content)
        this.items.set(normalized, {
            content: buffer,
            size: buffer.length,
            lastModified: new Date(),
            mimeType: options.mimeType,
            metadata: options.metadata,
            visibility: options.visibility ?? this.config.visibility ?? 'private',
        })
    }

    async read(key: string): Promise<Buffer> {
        return Buffer.from(this.item(key).content)
    }

    async readStream(key: string): Promise<Readable> {
        return Readable.from(await this.read(key))
    }

    async exists(key: string): Promise<boolean> {
        return this.items.has(this.prefixer.normalize(key))
    }

    async metadata(key: string): Promise<FileMetadata> {
        return this.itemMetadata(this.item(key))
    }

    async* list(prefix = '', options: ListOptions = {}): AsyncIterable<StorageEntry> {
        const normalized = this.prefixer.normalize(prefix, true)
        const directories = new Set<string>()
        for (const [key, item] of [...this.items.entries()].sort(([left], [right]) => left.localeCompare(right))) {
            if (normalized && key !== normalized && !key.startsWith(`${normalized}/`)) {
                continue
            }
            const remainder = normalized ? key.slice(normalized.length).replace(/^\//, '') : key
            if (!options.recursive && remainder.includes('/')) {
                const directory = [normalized, remainder.split('/')[0]].filter(Boolean).join('/')
                if (!directories.has(directory)) {
                    directories.add(directory)
                    yield {key: directory, type: 'directory'}
                }
                continue
            }
            yield {key, type: 'file', ...this.itemMetadata(item)}
        }
    }

    async delete(key: string): Promise<void> {
        this.items.delete(this.prefixer.normalize(key))
    }

    async deleteDirectory(prefix: string): Promise<void> {
        const normalized = this.prefixer.normalize(prefix)
        for (const key of this.items.keys()) {
            if (key === normalized || key.startsWith(`${normalized}/`)) {
                this.items.delete(key)
            }
        }
    }

    async copy(source: string, destination: string): Promise<void> {
        const sourceItem = this.item(source)
        this.items.set(this.prefixer.normalize(destination), {...sourceItem, content: Buffer.from(sourceItem.content)})
    }

    async move(source: string, destination: string): Promise<void> {
        await this.copy(source, destination)
        await this.delete(source)
    }

    async visibility(key: string): Promise<Visibility> {
        return this.item(key).visibility ?? 'private'
    }

    async setVisibility(key: string, visibility: Visibility): Promise<void> {
        this.item(key).visibility = visibility
    }

    url(): string {
        throw new UnsupportedStorageOperation('url')
    }

    private item(key: string): MemoryItem {
        const item = this.items.get(this.prefixer.normalize(key))
        if (!item) {
            throw new StorageFileNotFound(key)
        }
        return item
    }

    private itemMetadata(item: MemoryItem): FileMetadata {
        return {
            size: item.size,
            lastModified: item.lastModified,
            mimeType: item.mimeType,
            etag: item.etag,
            metadata: item.metadata,
            visibility: item.visibility,
        }
    }
}
