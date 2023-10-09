import * as fileSystemDeprecated from 'fs'
import { File } from './File'
import * as path from 'path'
import * as fileSystem from 'node:fs/promises'

export class Storage {
    files(directory: string, recursively = false): File[] {
        return fileSystemDeprecated
            .readdirSync(directory) // TODO make this async
            .reduce((files, name) => {
                const filePath = path.join(directory, name)
                const stats = fileSystemDeprecated.statSync(filePath)
                if (stats.isFile()) {
                    const file = new File(name)
                    file.directory = directory
                    files.push(file)
                }

                if (recursively && stats.isDirectory()) {
                    files = files.concat(this.files(filePath))
                }
                return files
            }, [] as File[])
    }

    async read(filePath: string): Promise<Buffer> {
        return fileSystem.readFile(filePath)
    }

    async exists(filePath: string): Promise<boolean> {
        try {
            await fileSystem.access(filePath)
            return true
        } catch (error) {
            return false
        }
    }

    async save(file: File, directory: string = '', name?: string | number): Promise<File> {
        const newPath = path.join(directory, file.name)
        if (!file.name) {
            file.name = String(name || this.generateRandomFileName() + '.' + file.extension)
        }
        if (directory && !(await this.exists(directory))) {
            await this.makeDirectory(directory)
        }
        return new Promise(async (resolve, reject) => {
            fileSystemDeprecated
                .createReadStream(file.path)
                .on('error', reject)
                .pipe(fileSystemDeprecated.createWriteStream(newPath))
                .on('finish', () => resolve(file))
                .on('error', reject)
        })
    }

    async put(filePath: string, content: string | Buffer, options?: any): Promise<File> {
        const file = new File(path.basename(filePath))
        file.directory = path.dirname(filePath)

        if (file.directory && !(await this.exists(file.directory))) {
            await this.makeDirectory(file.directory)
        }

        await fileSystem.writeFile(filePath, content, options)
        return file
    }

    async makeDirectory(directory: string): Promise<void> {
        await fileSystem.mkdir(directory, {recursive: true})
    }

    async deleteDirectory(directory: string): Promise<void> {
        if (await this.exists(directory)) {
            await fileSystem.rm(directory, {recursive: true})
        }
    }

    async delete(filePath: string): Promise<void> {
        if ((await fileSystem.stat(filePath)).isDirectory()) {
            throw new Error('Can not delete because this path leads to a directory and not a file.')
        }

        if (!(await this.exists(filePath))) {
            return
        }
        await fileSystem.unlink(filePath)
    }

    private generateRandomFileName(): string {
        const stringDomain =
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
        return (
            String.random(13, stringDomain) + '-' + new Date().getTime().toString()
        )
    }
}
