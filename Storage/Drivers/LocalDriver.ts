import fs from 'node:fs'
import * as fileSystem from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { PathPrefixer } from '../PathPrefixer'
import { StorageDriver } from '../StorageDriver'
import { StorageFileNotFound, UnsupportedStorageOperation } from '../errors'
import { FileMetadata, ListOptions, LocalDiskConfig, StorageContent, StorageEntry, Visibility, WriteOptions } from '../types'

export class LocalDriver extends StorageDriver {
    private readonly prefixer = new PathPrefixer()

    constructor(private readonly config: LocalDiskConfig) {
        super()
    }

    async write(key: string, content: StorageContent, options: WriteOptions = {}): Promise<void> {
        const destination = this.path(key)
        await fileSystem.mkdir(path.dirname(destination), {recursive: true})
        if (content instanceof Readable) {
            await pipeline(content, fs.createWriteStream(destination))
        } else {
            await fileSystem.writeFile(destination, content)
        }
        await this.setVisibility(key, options.visibility ?? this.config.visibility ?? 'private')
    }

    async read(key: string): Promise<Buffer> {
        try {
            return await fileSystem.readFile(this.path(key))
        } catch (error) {
            if ((error as {code?: string}).code === 'ENOENT') {
                throw new StorageFileNotFound(key)
            }
            throw error
        }
    }

    async readStream(key: string): Promise<Readable> {
        if (!(await this.exists(key))) {
            throw new StorageFileNotFound(key)
        }
        return fs.createReadStream(this.path(key))
    }

    async exists(key: string): Promise<boolean> {
        try {
            return (await fileSystem.stat(this.path(key))).isFile()
        } catch {
            return false
        }
    }

    async metadata(key: string): Promise<FileMetadata> {
        try {
            const stats = await fileSystem.stat(this.path(key))
            if (!stats.isFile()) {
                throw new StorageFileNotFound(key)
            }
            return {
                size: stats.size,
                lastModified: stats.mtime,
                visibility: this.visibilityFromMode(stats.mode),
            }
        } catch (error) {
            if ((error as {code?: string}).code === 'ENOENT') {
                throw new StorageFileNotFound(key)
            }
            throw error
        }
    }

    async* list(prefix = '', options: ListOptions = {}): AsyncIterable<StorageEntry> {
        const normalizedPrefix = this.prefixer.normalize(prefix, true)
        const directory = normalizedPrefix ? this.path(normalizedPrefix) : path.resolve(this.config.root)
        if (!(await fileSystem.stat(directory).catch(() => undefined))?.isDirectory()) {
            return
        }
        yield* this.listDirectory(directory, normalizedPrefix, options.recursive ?? false)
    }

    async delete(key: string): Promise<void> {
        await fileSystem.unlink(this.path(key)).catch((error: {code?: string}) => {
            if (error.code !== 'ENOENT') {
                throw error
            }
        })
    }

    async deleteDirectory(prefix: string): Promise<void> {
        await fileSystem.rm(this.path(prefix), {recursive: true, force: true})
    }

    async copy(source: string, destination: string): Promise<void> {
        const destinationPath = this.path(destination)
        await fileSystem.mkdir(path.dirname(destinationPath), {recursive: true})
        try {
            await fileSystem.copyFile(this.path(source), destinationPath)
        } catch (error) {
            if ((error as {code?: string}).code === 'ENOENT') {
                throw new StorageFileNotFound(source)
            }
            throw error
        }
    }

    async move(source: string, destination: string): Promise<void> {
        const destinationPath = this.path(destination)
        await fileSystem.mkdir(path.dirname(destinationPath), {recursive: true})
        try {
            await fileSystem.rename(this.path(source), destinationPath)
        } catch (error) {
            if ((error as {code?: string}).code === 'ENOENT') {
                throw new StorageFileNotFound(source)
            }
            throw error
        }
    }

    async visibility(key: string): Promise<Visibility> {
        try {
            return this.visibilityFromMode((await fileSystem.stat(this.path(key))).mode)
        } catch (error) {
            if ((error as {code?: string}).code === 'ENOENT') {
                throw new StorageFileNotFound(key)
            }
            throw error
        }
    }

    async setVisibility(key: string, visibility: Visibility): Promise<void> {
        try {
            await fileSystem.chmod(this.path(key), visibility === 'public' ? 0o644 : 0o600)
        } catch (error) {
            if ((error as {code?: string}).code === 'ENOENT') {
                throw new StorageFileNotFound(key)
            }
            throw error
        }
    }

    url(key: string): string {
        if (!this.config.url) {
            throw new UnsupportedStorageOperation('url')
        }
        return `${this.config.url.replace(/\/$/, '')}/${this.encodeKey(key)}`
    }

    private path(key: string): string {
        return this.prefixer.resolve(this.config.root, key)
    }

    private async* listDirectory(directory: string, prefix: string, recursive: boolean): AsyncIterable<StorageEntry> {
        const entries = await fileSystem.readdir(directory, {withFileTypes: true})
        entries.sort((left, right) => left.name.localeCompare(right.name))
        for (const entry of entries) {
            const key = [prefix, entry.name].filter(Boolean).join('/')
            if (entry.isDirectory()) {
                yield {key, type: 'directory'}
                if (recursive) {
                    yield* this.listDirectory(path.join(directory, entry.name), key, true)
                }
            } else if (entry.isFile()) {
                yield {key, type: 'file', ...await this.metadata(key)}
            }
        }
    }

    private visibilityFromMode(mode: number): Visibility {
        return Math.floor(mode / 4) % 2 === 1 ? 'public' : 'private'
    }

    private encodeKey(key: string): string {
        return this.prefixer.normalize(key).split('/').map(encodeURIComponent).join('/')
    }
}
