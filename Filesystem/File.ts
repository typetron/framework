export class File {

    extension: string;
    name: string;
    fullPath: string;

    constructor(public directory: string, public filename: string) {
        const fileParts = this.filename.split('.');

        this.fullPath = this.directory + '/' + this.filename;
        this.extension = fileParts[fileParts.length - 1];
        this.name = fileParts[fileParts.length - 2];
    }
}
