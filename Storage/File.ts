import path from 'node:path'
import { FileMetadata, Visibility } from './types'

export class File {
    originalName?: string
    saved = false
    size?: number
    lastModified?: Date
    mimeType?: string
    etag?: string
    metadata?: Record<string, string>
    visibility?: Visibility

    constructor(
        public key: string,
        public disk?: string,
        metadata: Partial<FileMetadata> = {},
    ) {
        Object.assign(this, metadata)
    }

    get name(): string {
        return path.posix.basename(this.key.replaceAll('\\', '/'))
    }

    get directory(): string {
        const directory = path.posix.dirname(this.key.replaceAll('\\', '/'))
        return directory === '.' ? '' : directory
    }

    /** The logical storage key. Kept as an alias for existing file consumers. */
    get path(): string {
        return this.key
    }

    get extension(): string | undefined {
        const extension = path.posix.extname(this.name)
        return extension ? extension.slice(1) : undefined
    }

    guessExtension(): string | undefined {
        return this.extension
    }

    toString(): string {
        return this.name
    }
}
