import * as fileSystem from 'fs';
import { File } from './File';

export class Filesystem {
    files(directory: string, recursively = false): File[] {
        return fileSystem
            .readdirSync(directory)
            .reduce((files, item) => {
                const path = directory + '/' + item;
                const stats = fileSystem.statSync(path);
                if (stats.isFile()) {
                    files.push(new File(directory, item));
                }

                if (recursively && stats.isDirectory()) {
                    files = files.concat(this.files(path));
                }
                return files;
            }, [] as File[]);
    }

    async read(file: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            fileSystem.readFile(file, (error, data) => {
                if (error) {
                    return reject(error);
                }
                resolve(data);
            });
        });
    }

}
