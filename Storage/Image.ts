import { InvalidImage } from './InvalidImage';
import { File } from './File';

export class Image extends File {
    static fromBase64(base64: string): Image {
        const matches = base64.match(/data:image\/([a-zA-Z]*);base64,([^\\"]*)/);
        if (!matches) {
            throw new InvalidImage();
        }
        if (matches.length !== 3) {
            throw InvalidImage;
        }
        const extension = matches[1];
        const data = matches[2];

        const image = new this('.' + extension);
        image.content = Buffer.from(data, 'base64');
        return image;
    }
}
