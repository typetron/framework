import { Readable } from 'node:stream'

export type StorageContent = string | Buffer | Readable
export type Visibility = 'private' | 'public'

export interface FileMetadata {
    size?: number
    lastModified?: Date
    mimeType?: string
    etag?: string
    metadata?: Record<string, string>
    visibility?: Visibility
}

export interface StorageEntry extends FileMetadata {
    key: string
    type: 'file' | 'directory'
}

export interface WriteOptions {
    visibility?: Visibility
    mimeType?: string
    metadata?: Record<string, string>
    cacheControl?: string
    contentDisposition?: string
}

export interface ListOptions {
    recursive?: boolean
}

export interface TemporaryUrlOptions {
    responseContentType?: string
    responseContentDisposition?: string
}

export interface LocalDiskConfig {
    driver: 'local'
    root: string
    url?: string
    visibility?: Visibility
}

export interface S3DiskConfig {
    driver: 's3'
    bucket: string
    region: string
    endpoint?: string
    forcePathStyle?: boolean
    prefix?: string
    url?: string
    visibility?: Visibility
    credentials?: {
        accessKeyId: string
        secretAccessKey: string
        sessionToken?: string
    }
}

export interface MemoryDiskConfig {
    driver: 'memory'
    visibility?: Visibility
}

export interface ScopedDiskConfig {
    driver: 'scoped'
    disk: string
    prefix: string
}

export interface ReadOnlyDiskConfig {
    driver: 'read-only'
    disk: string
}

export interface CustomDiskConfig {
    driver: string

    [option: string]: unknown
}

export type StorageDiskConfig =
    | LocalDiskConfig
    | S3DiskConfig
    | MemoryDiskConfig
    | ScopedDiskConfig
    | ReadOnlyDiskConfig
    | CustomDiskConfig

export interface StorageConfiguration {
    default: string
    disks: Record<string, StorageDiskConfig>
}
