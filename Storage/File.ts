import * as path from 'path'

export class File {
    directory?: string
    content?: string | Buffer
    originalName?: string

    saved = false

    constructor(public name: string) {
    }

    get extension() {
        return this.guessExtension()
    }

    get path() {
        return path.join(this.directory || '', this.name)
    }

    guessExtension() {
        const fileParts = this.name.split('.')
        if (fileParts.length >= 1) {
            return fileParts.pop()
        }
    }

    toString() {
        return this.name
    }
}
