import { InvalidImage } from '@Typetron/Storage/InvalidImage'

export function fromBase64(base64: string): {extension: string, content: Buffer} {
    const matches = base64.match(/data:image\/([a-zA-Z]*);base64,([^\\"]*)/)
    if (!matches) {
        throw new InvalidImage()
    }
    if (matches.length !== 3) {
        throw InvalidImage
    }
    const extension = matches[1]
    const data = matches[2]

    return {
        content: Buffer.from(data, 'base64'),
        extension: extension
    }
}
