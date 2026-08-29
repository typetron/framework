import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import { File } from './File'

export class UploadedFile extends File {
    constructor(
        public temporaryPath: string,
        originalName: string,
        public uploadMimeType?: string,
    ) {
        super(temporaryPath)
        this.originalName = originalName
        this.mimeType = uploadMimeType
        this.saved = true
    }

    stream(): Readable {
        return createReadStream(this.temporaryPath)
    }
}
