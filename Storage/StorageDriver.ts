import { Readable } from 'node:stream'
import { FileMetadata, ListOptions, StorageContent, StorageEntry, TemporaryUrlOptions, Visibility, WriteOptions } from './types'

export abstract class StorageDriver {
    abstract write(key: string, content: StorageContent, options?: WriteOptions): Promise<void>
    abstract read(key: string): Promise<Buffer>
    abstract readStream(key: string): Promise<Readable>
    abstract exists(key: string): Promise<boolean>
    abstract metadata(key: string): Promise<FileMetadata>
    abstract list(prefix?: string, options?: ListOptions): AsyncIterable<StorageEntry>
    abstract delete(key: string): Promise<void>
    abstract deleteDirectory(prefix: string): Promise<void>
    abstract copy(source: string, destination: string): Promise<void>
    abstract move(source: string, destination: string): Promise<void>
    abstract visibility(key: string): Promise<Visibility>
    abstract setVisibility(key: string, visibility: Visibility): Promise<void>

    url?(key: string): string
    temporaryUrl?(key: string, expiresInSeconds: number, options?: TemporaryUrlOptions): Promise<string>
}
